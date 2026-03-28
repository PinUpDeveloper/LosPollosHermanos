use anchor_lang::prelude::*;

pub const TITLE_MAX_LEN: usize = 100;
pub const DESCRIPTION_MAX_LEN: usize = 512;

#[account]
pub struct Campaign {
    pub farmer: Pubkey,
    pub oracle: Pubkey,
    pub campaign_id: u64,
    pub title: String,
    pub description: String,
    pub total_supply: u64,
    pub tokens_sold: u64,
    pub price_per_token: u64,
    pub vault: Pubkey,
    pub token_mint: Pubkey,
    pub status: CampaignStatus,
    pub harvest_total_usdc: u64,
    pub proof_hash: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}

impl Campaign {
    pub const SPACE: usize = 8
        + 32
        + 32
        + 8
        + 4
        + TITLE_MAX_LEN
        + 4
        + DESCRIPTION_MAX_LEN
        + 8
        + 8
        + 8
        + 32
        + 32
        + 1
        + 8
        + 32
        + 8
        + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CampaignStatus {
    Active,
    Funded,
    HarvestSold,
    Distributed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCampaignInput {
    pub oracle: Pubkey,
    pub title: String,
    pub description: String,
    pub total_supply: u64,
    pub price_per_token: u64,
    pub proof_hash: [u8; 32],
}

