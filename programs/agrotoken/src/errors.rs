use anchor_lang::prelude::*;

#[error_code]
pub enum AgroTokenError {
    #[msg("Campaign is not active")]
    CampaignNotActive,
    #[msg("Campaign is not funded")]
    CampaignNotFunded,
    #[msg("Campaign is not ready for distribution")]
    CampaignNotReadyForDistribution,
    #[msg("Unauthorized caller")]
    Unauthorized,
    #[msg("Invalid token amount")]
    InvalidAmount,
    #[msg("Campaign supply exceeded")]
    SupplyExceeded,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Distribution requires holder accounts in remaining_accounts")]
    MissingHolderAccounts,
    #[msg("Campaign cannot be cancelled in current state")]
    InvalidCancelState,
}

