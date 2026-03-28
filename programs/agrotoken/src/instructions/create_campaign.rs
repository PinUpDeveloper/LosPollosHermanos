use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::state::{Campaign, CampaignStatus, CreateCampaignInput};

#[derive(Accounts)]
#[instruction(campaign_id: u64)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub farmer: Signer<'info>,
    #[account(
        init,
        payer = farmer,
        space = Campaign::SPACE,
        seeds = [b"campaign", farmer.key().as_ref(), &campaign_id.to_le_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateCampaign>,
    campaign_id: u64,
    input: CreateCampaignInput,
) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    campaign.farmer = ctx.accounts.farmer.key();
    campaign.oracle = input.oracle;
    campaign.campaign_id = campaign_id;
    campaign.title = input.title;
    campaign.description = input.description;
    campaign.total_supply = input.total_supply;
    campaign.tokens_sold = 0;
    campaign.price_per_token = input.price_per_token;
    campaign.vault = ctx.accounts.vault.key();
    campaign.token_mint = ctx.accounts.token_mint.key();
    campaign.status = CampaignStatus::Active;
    campaign.harvest_total_usdc = 0;
    campaign.proof_hash = input.proof_hash;
    campaign.created_at = Clock::get()?.unix_timestamp;
    campaign.bump = ctx.bumps.campaign;
    Ok(())
}

