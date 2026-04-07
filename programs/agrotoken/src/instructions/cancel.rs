use anchor_lang::prelude::*;

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct CancelCampaign<'info> {
    #[account(mut)]
    pub farmer: Signer<'info>,

    #[account(mut, has_one = farmer)]
    pub campaign: Account<'info, Campaign>,
}

pub fn handler(ctx: Context<CancelCampaign>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;

    require!(
        campaign.status == CampaignStatus::Active,
        AgroTokenError::InvalidCancelState
    );

    campaign.status = CampaignStatus::Cancelled;

    Ok(())
}
