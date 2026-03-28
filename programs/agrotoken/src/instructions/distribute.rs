use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Token, TokenAccount, Transfer};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct Distribute<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = vault)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Distribute>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let authority = ctx.accounts.authority.key();

    require!(
        authority == campaign.farmer || authority == campaign.oracle,
        AgroTokenError::Unauthorized
    );
    require!(
        campaign.status == CampaignStatus::HarvestSold,
        AgroTokenError::CampaignNotReadyForDistribution
    );
    require!(
        !ctx.remaining_accounts.is_empty(),
        AgroTokenError::MissingHolderAccounts
    );

    for account_info in ctx.remaining_accounts.iter() {
        let holder_vault: Account<TokenAccount> = Account::try_from(account_info)?;
        if holder_vault.amount == 0 {
            continue;
        }

        let payout = holder_vault
            .amount
            .checked_mul(campaign.harvest_total_usdc)
            .ok_or(AgroTokenError::MathOverflow)?
            .checked_div(campaign.total_supply)
            .ok_or(AgroTokenError::MathOverflow)?;

        let seeds = &[
            b"campaign",
            campaign.farmer.as_ref(),
            &campaign.campaign_id.to_le_bytes(),
            &[campaign.bump],
        ];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: holder_vault.to_account_info(),
                    authority: ctx.accounts.campaign.to_account_info(),
                },
                &[seeds],
            ),
            payout,
        )?;
    }

    campaign.status = CampaignStatus::Distributed;
    Ok(())
}

