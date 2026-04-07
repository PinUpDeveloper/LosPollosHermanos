use anchor_lang::prelude::*;

/// Maximum byte length for campaign title.
pub const TITLE_MAX_LEN: usize = 100;
/// Maximum byte length for campaign description.
pub const DESCRIPTION_MAX_LEN: usize = 512;

/// On-chain state that tracks every campaign through its lifecycle.
#[account]
pub struct Campaign {
    /// The farmer who created the campaign.
    pub farmer: Pubkey,
    /// An oracle/authority that can confirm harvests.
    pub oracle: Pubkey,
    /// Unique numeric id chosen by the farmer.
    pub campaign_id: u64,
    /// Human-readable title (≤ TITLE_MAX_LEN bytes).
    pub title: String,
    /// Human-readable description (≤ DESCRIPTION_MAX_LEN bytes).
    pub description: String,
    /// Total number of share-tokens available for sale.
    pub total_supply: u64,
    /// Number of share-tokens sold so far.
    pub tokens_sold: u64,
    /// Price-per-token in USDC lamports (6 decimals).
    pub price_per_token: u64,
    /// PDA token-account that holds investor USDC.
    pub vault: Pubkey,
    /// Mint of the share-token (decimals = 0).
    pub token_mint: Pubkey,
    /// Current lifecycle stage.
    pub status: CampaignStatus,
    /// Total harvest revenue in USDC lamports, set by oracle.
    pub harvest_total_usdc: u64,
    /// SHA-256 of off-chain proof document.
    pub proof_hash: [u8; 32],
    /// Unix timestamp of creation.
    pub created_at: i64,
    /// PDA bump seed.
    pub bump: u8,
}

impl Campaign {
    pub const SPACE: usize = 8  // discriminator
        + 32  // farmer
        + 32  // oracle
        + 8   // campaign_id
        + 4 + TITLE_MAX_LEN       // title (String prefix + data)
        + 4 + DESCRIPTION_MAX_LEN  // description
        + 8   // total_supply
        + 8   // tokens_sold
        + 8   // price_per_token
        + 32  // vault
        + 32  // token_mint
        + 1   // status enum
        + 8   // harvest_total_usdc
        + 32  // proof_hash
        + 8   // created_at
        + 1;  // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum CampaignStatus {
    Active,
    Funded,
    HarvestSold,
    Distributed,
    Completed,
    Cancelled,
}

/// Input argument struct passed when creating a new campaign.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCampaignInput {
    pub oracle: Pubkey,
    pub title: String,
    pub description: String,
    pub total_supply: u64,
    pub price_per_token: u64,
    pub proof_hash: [u8; 32],
}
