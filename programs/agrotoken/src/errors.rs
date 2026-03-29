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
    #[msg("Campaign metadata exceeds allocated storage")]
    MetadataTooLong,
    #[msg("USDC mint must use 6 decimals")]
    InvalidUsdcMint,
    #[msg("Remaining accounts must be passed in pairs")]
    InvalidRemainingAccounts,
    #[msg("Invalid holder share token account")]
    InvalidHolderTokenAccount,
    #[msg("Invalid payout token account")]
    InvalidPayoutTokenAccount,
    #[msg("Holder authority must sign and own the share token account")]
    InvalidHolderAuthority,
}

