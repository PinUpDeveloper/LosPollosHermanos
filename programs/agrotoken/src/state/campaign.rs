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
    pub const SPACE: usize = 8  // discriminator
        + 32  // farmer
        + 32  // oracle
        + 8   // campaign_id
        + 4 + TITLE_MAX_LEN       // title (String)
        + 4 + DESCRIPTION_MAX_LEN // description (String)
        + 8   // total_supply
        + 8   // tokens_sold
        + 8   // price_per_token
        + 32  // vault
        + 32  // token_mint
        + 1   // status
        + 8   // harvest_total_usdc
        + 32  // proof_hash
        + 8   // created_at
        + 1;  // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CampaignStatus {
    Active,
    Funded,
    HarvestSold,
    Distributed,
    Completed,
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
