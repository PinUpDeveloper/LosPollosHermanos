use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, transfer, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(
        mut,
        has_one = token_mint,
        has_one = vault
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(
        mut,
        constraint = investor_usdc_account.owner == investor.key() @ AgroTokenError::Unauthorized,
        constraint = investor_usdc_account.mint == vault.mint @ AgroTokenError::InvalidUsdcMint
    )]
    pub investor_usdc_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = investor_token_account.owner == investor.key() @ AgroTokenError::Unauthorized,
        constraint = investor_token_account.mint == token_mint.key() @ AgroTokenError::InvalidHolderTokenAccount
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

    let updated_sold = ctx
        .accounts
        .campaign
        .tokens_sold
        .checked_add(amount)
        .ok_or(AgroTokenError::MathOverflow)?;
    require!(
        updated_sold <= ctx.accounts.campaign.total_supply,
        AgroTokenError::SupplyExceeded
    );

    let payment = amount
        .checked_mul(ctx.accounts.campaign.price_per_token)
        .ok_or(AgroTokenError::MathOverflow)?;

    transfer(
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

    let seeds = &[
        b"campaign".as_ref(),
        ctx.accounts.campaign.farmer.as_ref(),
        &ctx.accounts.campaign.campaign_id.to_le_bytes(),
        &[ctx.accounts.campaign.bump],
    ];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.investor_token_account.to_account_info(),
                authority: ctx.accounts.campaign.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )?;

    ctx.accounts.campaign.tokens_sold = updated_sold;
    if ctx.accounts.campaign.tokens_sold == ctx.accounts.campaign.total_supply {
        ctx.accounts.campaign.status = CampaignStatus::Funded;
    }

    Ok(())
}
