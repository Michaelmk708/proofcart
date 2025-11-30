use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("HAYAMhivpCAegM7oepacQmr8TTbxKmpvjrxfuo3E2kNU");

#[program]
pub mod escrow {
    use super::*;

    /// Initialize an escrow account for a marketplace transaction
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        order_id: String,
        amount: u64,
        bump: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = ctx.accounts.seller.key();
        escrow.order_id = order_id;
        escrow.amount = amount;
        escrow.state = EscrowState::Created;
        escrow.bump = bump;
        escrow.created_at = Clock::get()?.unix_timestamp;
        
        // Transfer funds from buyer to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.buyer_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        
        escrow.state = EscrowState::Locked;
        
        msg!("Escrow created for order: {}, amount: {}", escrow.order_id, amount);
        
        Ok(())
    }

    /// Release funds to seller when buyer confirms delivery
    pub fn release_escrow(
        ctx: Context<ReleaseEscrow>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        require!(
            escrow.state == EscrowState::Locked,
            EscrowError::InvalidState
        );
        
        require!(
            escrow.buyer == ctx.accounts.buyer.key(),
            EscrowError::Unauthorized
        );
        
        // Transfer funds from escrow to seller
        let seeds = &[
            b"escrow",
            escrow.order_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.state = EscrowState::Released;
        escrow.released_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Escrow released for order: {}", escrow.order_id);
        
        Ok(())
    }

    /// Refund buyer if there's a dispute or cancellation
    pub fn refund_escrow(
        ctx: Context<RefundEscrow>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        require!(
            escrow.state == EscrowState::Locked || escrow.state == EscrowState::Disputed,
            EscrowError::InvalidState
        );
        
        // Only seller or admin can initiate refund
        require!(
            escrow.seller == ctx.accounts.authority.key() || 
            ctx.accounts.authority.key() == escrow.buyer, // Allow buyer in disputed state
            EscrowError::Unauthorized
        );
        
        // Transfer funds back to buyer
        let seeds = &[
            b"escrow",
            escrow.order_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.state = EscrowState::Refunded;
        
        msg!("Escrow refunded for order: {}", escrow.order_id);
        
        Ok(())
    }

    /// Mark escrow as disputed (locks it for admin resolution)
    pub fn dispute_escrow(
        ctx: Context<DisputeEscrow>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        require!(
            escrow.state == EscrowState::Locked,
            EscrowError::InvalidState
        );
        
        require!(
            escrow.buyer == ctx.accounts.authority.key() || 
            escrow.seller == ctx.accounts.authority.key(),
            EscrowError::Unauthorized
        );
        
        escrow.state = EscrowState::Disputed;
        
        msg!("Escrow disputed for order: {}", escrow.order_id);
        
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
#[instruction(order_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + Escrow::LEN,
        seeds = [b"escrow", order_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Seller address is stored but not a signer
    pub seller: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.order_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.order_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DisputeEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.order_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    pub authority: Signer<'info>,
}

// Data structures
#[account]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub order_id: String,
    pub amount: u64,
    pub state: EscrowState,
    pub bump: u8,
    pub created_at: i64,
    pub released_at: Option<i64>,
}

impl Escrow {
    pub const LEN: usize = 32 + 32 + (4 + 50) + 8 + 1 + 1 + 8 + (1 + 8);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowState {
    Created,
    Locked,
    Released,
    Refunded,
    Disputed,
}

// Error codes
#[error_code]
pub enum EscrowError {
    #[msg("Invalid escrow state for this operation")]
    InvalidState,
    #[msg("Unauthorized to perform this action")]
    Unauthorized,
}
