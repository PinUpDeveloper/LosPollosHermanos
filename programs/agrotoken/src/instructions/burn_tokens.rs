use anchor_lang::prelude::*;
use anchor_spl::token::{burn, close_account, Burn, CloseAccount, Mint, Token, TokenAccount};

use crate::errors::AgroTokenError;
use crate::state::{Campaign, CampaignStatus};

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = token_mint)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<BurnTokens>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;
    let authority = ctx.accounts.authority.key();

    require!(
        authority == campaign.farmer || authority == campaign.oracle,
        AgroTokenError::Unauthorized
    );
    require!(
        campaign.status == CampaignStatus::Distributed,
        AgroTokenError::CampaignNotReadyForDistribution
    );
    require!(
        !ctx.remaining_accounts.is_empty(),
        AgroTokenError::MissingHolderAccounts
    );
    require!(
        ctx.remaining_accounts.len() % 2 == 0,
        AgroTokenError::InvalidRemainingAccounts
    );

    let token_mint_key = ctx.accounts.token_mint.key();

    for accounts in ctx.remaining_accounts.chunks_exact(2) {
        let holder_token_account: Account<TokenAccount> = Account::try_from(&accounts[0])?;
        let holder_authority = &accounts[1];

        require!(
            holder_token_account.mint == token_mint_key,
            AgroTokenError::InvalidHolderTokenAccount
        );
        require!(holder_authority.is_signer, AgroTokenError::InvalidHolderAuthority);
        require!(
            holder_token_account.owner == *holder_authority.key,
            AgroTokenError::InvalidHolderAuthority
        );

        if holder_token_account.amount == 0 {
            continue;
        }

        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.token_mint.to_account_info(),
                    from: holder_token_account.to_account_info(),
                    authority: holder_authority.to_account_info(),
                },
            ),
            holder_token_account.amount,
        )?;

        close_account(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: holder_token_account.to_account_info(),
                destination: holder_authority.to_account_info(),
                authority: holder_authority.to_account_info(),
            },
        ))?;
    }

    Ok(())
}

