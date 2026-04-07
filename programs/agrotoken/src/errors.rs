use anchor_lang::prelude::*;

#[error_code]
pub enum AgroTokenError {
    #[msg("Campaign is not in Active status")]
    CampaignNotActive,

    #[msg("Campaign is not in Funded status")]
    CampaignNotFunded,

    #[msg("Campaign is not ready for distribution")]
    CampaignNotReadyForDistribution,

    #[msg("Unauthorized caller")]
    Unauthorized,

    #[msg("Token amount must be greater than zero")]
    InvalidAmount,

    #[msg("Purchase would exceed total supply")]
    SupplyExceeded,

    #[msg("Arithmetic overflow")]
    MathOverflow,

    #[msg("Holder accounts must be passed via remaining_accounts")]
    MissingHolderAccounts,

    #[msg("Campaign cannot be cancelled in current state")]
    InvalidCancelState,

    #[msg("Title or description exceeds max length")]
    MetadataTooLong,

    #[msg("USDC mint must have 6 decimals")]
    InvalidUsdcMint,

    #[msg("remaining_accounts must come in pairs")]
    InvalidRemainingAccounts,

    #[msg("Token account mint does not match share-token mint")]
    InvalidHolderTokenAccount,

    #[msg("Payout account mint does not match USDC mint")]
    InvalidPayoutTokenAccount,

    #[msg("Holder authority mismatch or missing signature")]
    InvalidHolderAuthority,
}
