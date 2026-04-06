use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

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
        constraint = authority.key() == campaign.farmer || authority.key() == campaign.oracle @ AgroTokenError::Unauthorized
    )]
    pub campaign: Account<'info, Campaign>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handler<'info>(ctx: Context<'_, '_, 'info, 'info, Distribute<'info>>) -> Result<()> {
    require!(
        ctx.accounts.campaign.status == CampaignStatus::HarvestSold,
        AgroTokenError::CampaignNotReadyForDistribution
    );
    require!(
        !ctx.remaining_accounts.is_empty(),
        AgroTokenError::MissingHolderAccounts
    );
    require!(
        ctx.remaining_accounts.len() % 2 == 0,
        AgroTokenError::InvalidRemainingAccounts
    );

    let token_mint_key = ctx.accounts.token_mint.key();
    let vault_mint = ctx.accounts.vault.mint;
    let campaign = &ctx.accounts.campaign;
    let seeds = &[
        b"campaign".as_ref(),
        campaign.farmer.as_ref(),
        &campaign.campaign_id.to_le_bytes(),
        &[campaign.bump],
    ];

    let remaining = ctx.remaining_accounts;
    let mut i = 0;
    while i < remaining.len() {
        let holder_token_account: Account<'info, TokenAccount> = Account::try_from(&remaining[i])?;
        let holder_usdc_account: Account<'info, TokenAccount> = Account::try_from(&remaining[i + 1])?;
        i += 2;

        require!(
            holder_token_account.mint == token_mint_key,
            AgroTokenError::InvalidHolderTokenAccount
        );
        require!(
            holder_usdc_account.mint == vault_mint,
            AgroTokenError::InvalidPayoutTokenAccount
        );
        require!(
            holder_token_account.owner == holder_usdc_account.owner,
            AgroTokenError::InvalidPayoutTokenAccount
        );

        if holder_token_account.amount == 0 {
            continue;
        }

        let payout = holder_token_account
            .amount
            .checked_mul(ctx.accounts.campaign.harvest_total_usdc)
            .ok_or(AgroTokenError::MathOverflow)?
            .checked_div(ctx.accounts.campaign.total_supply)
            .ok_or(AgroTokenError::MathOverflow)?;

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: holder_usdc_account.to_account_info(),
                    authority: ctx.accounts.campaign.to_account_info(),
                },
                &[seeds],
            ),
            payout,
        )?;
    }

    ctx.accounts.campaign.status = CampaignStatus::Distributed;
    Ok(())
}
