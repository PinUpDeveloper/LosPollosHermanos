use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, CloseAccount, Mint, Token, TokenAccount};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = token_mint,
        constraint = authority.key() == campaign.farmer
                  || authority.key() == campaign.oracle
            @ AgroTokenError::Unauthorized,
    )]
    pub campaign: Account<'info, Campaign>,

    #[account(mut)]
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

/// Burns all remaining share-tokens from each holder and closes their
/// token accounts.
///
/// `remaining_accounts` must contain pairs:
///   [holder_share_token_account, holder_authority (signer), ...]
pub fn handler<'info>(
    ctx: Context<'_, '_, 'info, 'info, BurnTokens<'info>>,
) -> Result<()> {
    require!(
        ctx.accounts.campaign.status == CampaignStatus::Distributed,
        AgroTokenError::CampaignNotReadyForDistribution
    );

    let remaining = ctx.remaining_accounts;
    require!(!remaining.is_empty(), AgroTokenError::MissingHolderAccounts);
    require!(remaining.len() % 2 == 0, AgroTokenError::InvalidRemainingAccounts);

    let token_mint_key = ctx.accounts.token_mint.key();

    let mut i = 0;
    while i < remaining.len() {
        let holder_token: Account<'info, TokenAccount> =
            Account::try_from(&remaining[i])?;
        let holder_authority = &remaining[i + 1];
        i += 2;

        require!(
            holder_token.mint == token_mint_key,
            AgroTokenError::InvalidHolderTokenAccount
        );
        require!(
            holder_authority.is_signer,
            AgroTokenError::InvalidHolderAuthority
        );
        require!(
            holder_token.owner == *holder_authority.key,
            AgroTokenError::InvalidHolderAuthority
        );

        if holder_token.amount == 0 {
            continue;
        }

        // Burn all share-tokens.
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    from: holder_token.to_account_info(),
                    authority: holder_authority.to_account_info(),
                },
            ),
            holder_token.amount,
        )?;

        // Close the token account, returning rent to the holder.
        token::close_account(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: holder_token.to_account_info(),
                destination: holder_authority.to_account_info(),
                authority: holder_authority.to_account_info(),
            },
        ))?;
    }

    ctx.accounts.campaign.status = CampaignStatus::Completed;

    Ok(())
}
