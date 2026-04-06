use anchor_lang::prelude::*;

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct ConfirmHarvest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        constraint = authority.key() == campaign.farmer || authority.key() == campaign.oracle @ AgroTokenError::Unauthorized
    )]
    pub campaign: Account<'info, Campaign>,
}

pub fn handler(ctx: Context<ConfirmHarvest>, harvest_total_usdc: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;

    require!(
        campaign.status == CampaignStatus::Funded || campaign.status == CampaignStatus::Active,
        AgroTokenError::CampaignNotFunded
    );

    campaign.harvest_total_usdc = harvest_total_usdc;
    campaign.status = CampaignStatus::HarvestSold;
    Ok(())
}
