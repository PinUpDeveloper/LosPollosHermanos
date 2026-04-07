use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = vault,
        has_one = token_mint,
        constraint = authority.key() == campaign.farmer
                  || authority.key() == campaign.oracle
            @ AgroTokenError::Unauthorized,
    )]
    pub campaign: Account<'info, Campaign>,

    pub token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

/// Distributes USDC from the vault to each holder proportionally.
///
/// `remaining_accounts` must contain pairs:
///   [holder_share_token_account, holder_usdc_account, ...]
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, Distribute<'info>>,
) -> Result<()> {
    require!(
        ctx.accounts.campaign.status == CampaignStatus::HarvestSold,
        AgroTokenError::CampaignNotReadyForDistribution
    );

    let remaining = ctx.remaining_accounts;
    require!(!remaining.is_empty(), AgroTokenError::MissingHolderAccounts);
    require!(remaining.len() % 2 == 0, AgroTokenError::InvalidRemainingAccounts);

    // Copy scalars into locals so we don't hold an immutable borrow on
    // `ctx.accounts.campaign` across the mutable status write at the end.
    let token_mint_key    = ctx.accounts.token_mint.key();
    let vault_mint        = ctx.accounts.vault.mint;
    let harvest_total     = ctx.accounts.campaign.harvest_total_usdc;
    let total_supply      = ctx.accounts.campaign.total_supply;
    let farmer_key        = ctx.accounts.campaign.farmer;
    let campaign_id_bytes = ctx.accounts.campaign.campaign_id.to_le_bytes();
    let bump_seed         = [ctx.accounts.campaign.bump];

    let signer_seeds: &[&[u8]] = &[
        b"campaign",
        farmer_key.as_ref(),
        &campaign_id_bytes,
        &bump_seed,
    ];

    let mut i = 0;
    while i < remaining.len() {
        let holder_share: Account<'info, TokenAccount> =
            Account::try_from(&remaining[i])?;
        let holder_usdc: Account<'info, TokenAccount> =
            Account::try_from(&remaining[i + 1])?;
        i += 2;

        // Validate mints and ownership.
        require!(
            holder_share.mint == token_mint_key,
            AgroTokenError::InvalidHolderTokenAccount
        );
        require!(
            holder_usdc.mint == vault_mint,
            AgroTokenError::InvalidPayoutTokenAccount
        );
        require!(
            holder_share.owner == holder_usdc.owner,
            AgroTokenError::InvalidPayoutTokenAccount
        );

        if holder_share.amount == 0 {
            continue;
        }

        // payout = holder_tokens * harvest_total / total_supply
        let payout = holder_share
            .amount
            .checked_mul(harvest_total)
            .ok_or(AgroTokenError::MathOverflow)?
            .checked_div(total_supply)
            .ok_or(AgroTokenError::MathOverflow)?;

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to:   holder_usdc.to_account_info(),
                    authority: ctx.accounts.campaign.to_account_info(),
                },
                &[signer_seeds],
            ),
            payout,
        )?;
    }

    ctx.accounts.campaign.status = CampaignStatus::Distributed;

    Ok(())
}
