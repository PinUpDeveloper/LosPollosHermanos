use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus, CreateCampaignInput};
use crate::state::{DESCRIPTION_MAX_LEN, TITLE_MAX_LEN};

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
    #[account(constraint = usdc_mint.decimals == 6 @ AgroTokenError::InvalidUsdcMint)]
    pub usdc_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = farmer,
        seeds = [b"token_mint", campaign.key().as_ref()],
        bump,
        mint::decimals = 0,
        mint::authority = campaign,
        mint::freeze_authority = campaign
    )]
    pub token_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = farmer,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = campaign
    )]
    pub vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<CreateCampaign>,
    campaign_id: u64,
    input: CreateCampaignInput,
) -> Result<()> {
    require!(
        input.title.as_bytes().len() <= TITLE_MAX_LEN
            && input.description.as_bytes().len() <= DESCRIPTION_MAX_LEN,
        AgroTokenError::MetadataTooLong
    );

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
