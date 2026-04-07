use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus, CreateCampaignInput, DESCRIPTION_MAX_LEN, TITLE_MAX_LEN};

#[derive(Accounts)]
#[instruction(campaign_id: u64)]
pub struct CreateCampaign<'info> {
    #[account(mut)]
    pub farmer: Signer<'info>,

    #[account(
        init,
        payer  = farmer,
        space  = Campaign::SPACE,
        seeds  = [b"campaign", farmer.key().as_ref(), &campaign_id.to_le_bytes()],
        bump,
    )]
    pub campaign: Account<'info, Campaign>,

    /// USDC mint – we enforce 6 decimals.
    #[account(constraint = usdc_mint.decimals == 6 @ AgroTokenError::InvalidUsdcMint)]
    pub usdc_mint: Account<'info, Mint>,

    /// Share-token mint created as PDA of the campaign.
    #[account(
        init,
        payer            = farmer,
        seeds            = [b"token_mint", campaign.key().as_ref()],
        bump,
        mint::decimals   = 0,
        mint::authority  = campaign,
    )]
    pub token_mint: Account<'info, Mint>,

    /// Vault that will hold collected USDC.
    #[account(
        init,
        payer             = farmer,
        seeds             = [b"vault", campaign.key().as_ref()],
        bump,
        token::mint       = usdc_mint,
        token::authority  = campaign,
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

    let c = &mut ctx.accounts.campaign;
    c.farmer           = ctx.accounts.farmer.key();
    c.oracle            = input.oracle;
    c.campaign_id       = campaign_id;
    c.title             = input.title;
    c.description       = input.description;
    c.total_supply      = input.total_supply;
    c.tokens_sold       = 0;
    c.price_per_token   = input.price_per_token;
    c.vault             = ctx.accounts.vault.key();
    c.token_mint        = ctx.accounts.token_mint.key();
    c.status            = CampaignStatus::Active;
    c.harvest_total_usdc = 0;
    c.proof_hash        = input.proof_hash;
    c.created_at        = Clock::get()?.unix_timestamp;
    c.bump              = ctx.bumps.campaign;

    Ok(())
}
