use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        has_one = token_mint,
        has_one = vault,
    )]
    pub campaign: Account<'info, Campaign>,

    /// Investor's USDC account (source of payment).
    #[account(
        mut,
        constraint = investor_usdc_account.owner == investor.key()
            @ AgroTokenError::Unauthorized,
        constraint = investor_usdc_account.mint == vault.mint
            @ AgroTokenError::InvalidUsdcMint,
    )]
    pub investor_usdc_account: Account<'info, TokenAccount>,

    /// Investor's share-token account (will receive minted tokens).
    #[account(
        mut,
        constraint = investor_token_account.owner == investor.key()
            @ AgroTokenError::Unauthorized,
        constraint = investor_token_account.mint == token_mint.key()
            @ AgroTokenError::InvalidHolderTokenAccount,
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, AgroTokenError::InvalidAmount);
    require!(
        ctx.accounts.campaign.status == CampaignStatus::Active,
        AgroTokenError::CampaignNotActive
    );

    let new_sold = ctx
        .accounts
        .campaign
        .tokens_sold
        .checked_add(amount)
        .ok_or(AgroTokenError::MathOverflow)?;

    require!(
        new_sold <= ctx.accounts.campaign.total_supply,
        AgroTokenError::SupplyExceeded
    );

    let payment = amount
        .checked_mul(ctx.accounts.campaign.price_per_token)
        .ok_or(AgroTokenError::MathOverflow)?;

    // Transfer USDC from investor → vault.
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.investor_usdc_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.investor.to_account_info(),
            },
        ),
        payment,
    )?;

    // Build PDA signer seeds — copy values into locals first to avoid
    // keeping an immutable borrow on `campaign` across the mutable write below.
    let farmer_key = ctx.accounts.campaign.farmer;
    let id_bytes = ctx.accounts.campaign.campaign_id.to_le_bytes();
    let bump_seed = [ctx.accounts.campaign.bump];

    let signer_seeds: &[&[u8]] = &[
        b"campaign",
        farmer_key.as_ref(),
        &id_bytes,
        &bump_seed,
    ];

    // Mint share-tokens to investor.
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.campaign.to_account_info(),
            },
            &[signer_seeds],
        ),
        amount,
    )?;

    // Update state.
    ctx.accounts.campaign.tokens_sold = new_sold;
    if new_sold == ctx.accounts.campaign.total_supply {
        ctx.accounts.campaign.status = CampaignStatus::Funded;
    }

    Ok(())
}
