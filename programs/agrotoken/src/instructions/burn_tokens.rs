use anchor_lang::prelude::*;

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
}

pub fn handler(ctx: Context<BurnTokens>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;
    let authority = ctx.accounts.authority.key();

    require!(
        authority == campaign.farmer || authority == campaign.oracle,
        AgroTokenError::Unauthorized
    );
    require!(
        campaign.status == CampaignStatus::Distributed,
        AgroTokenError::CampaignNotReadyForDistribution
    );

    Ok(())
}

