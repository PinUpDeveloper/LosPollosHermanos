use anchor_lang::prelude::*;

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct ConfirmHarvest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = authority.key() == campaign.farmer
                  || authority.key() == campaign.oracle
            @ AgroTokenError::Unauthorized,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(mut, address = campaign.vault)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub farmer_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ConfirmHarvest>, harvest_total_usdc: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;

    require!(
        campaign.status == CampaignStatus::Active
            || campaign.status == CampaignStatus::Funded,
        AgroTokenError::CampaignNotFunded
    );

    // If profit is greater than investment, farmer must provide the difference.
    let diff = harvest_total_usdc.saturating_sub(ctx.accounts.vault.amount);
    if diff > 0 {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.farmer_usdc.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            diff,
        )?;
    }

    campaign.harvest_total_usdc = harvest_total_usdc;
    campaign.status = CampaignStatus::HarvestSold;

    Ok(())
}
