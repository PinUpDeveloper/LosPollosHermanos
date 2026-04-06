use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("Agro111111111111111111111111111111111111111");

#[program]
pub mod agrotoken {
    use super::*;

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        campaign_id: u64,
        input: CreateCampaignInput,
    ) -> Result<()> {
        instructions::create_campaign::handler(ctx, campaign_id, input)
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
        instructions::buy_tokens::handler(ctx, amount)
    }

    pub fn confirm_harvest(ctx: Context<ConfirmHarvest>, harvest_total_usdc: u64) -> Result<()> {
        instructions::confirm_harvest::handler(ctx, harvest_total_usdc)
    }

    pub fn distribute(ctx: Context<Distribute>) -> Result<()> {
        instructions::distribute::handler(ctx)
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>) -> Result<()> {
        instructions::burn_tokens::handler(ctx)
    }

    pub fn cancel_campaign(ctx: Context<CancelCampaign>) -> Result<()> {
        instructions::cancel::handler(ctx)
    }
}
