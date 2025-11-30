use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Your Program ID Here - Will be generated on deployment");

#[program]
pub mod proofcart_escrow {
    use super::*;

    /// Initialize a new escrow account for an order
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
        escrow.status = EscrowStatus::Created;
        escrow.bump = bump;
        escrow.created_at = Clock::get()?.unix_timestamp;
        
        msg!("Escrow created for order: {}", escrow.order_id);
        msg!("Amount: {} lamports", amount);
        msg!("Buyer: {}", escrow.buyer);
        msg!("Seller: {}", escrow.seller);
        
        Ok(())
    }

    /// Confirm delivery and release funds to seller
    pub fn confirm_delivery(ctx: Context<ConfirmDelivery>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        // Only buyer can confirm delivery
        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            EscrowError::UnauthorizedBuyer
        );
        
        // Escrow must be in Created or Locked status
        require!(
            escrow.status == EscrowStatus::Created || escrow.status == EscrowStatus::Locked,
            EscrowError::InvalidEscrowStatus
        );
        
        // Transfer funds from escrow to seller
        let seeds = &[
            b"escrow".as_ref(),
            escrow.order_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow_account.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer,
        );
        
        anchor_lang::system_program::transfer(cpi_context, escrow.amount)?;
        
        // Update escrow status
        escrow.status = EscrowStatus::Released;
        escrow.released_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Funds released to seller for order: {}", escrow.order_id);
        msg!("Amount: {} lamports", escrow.amount);
        
        Ok(())
    }

    /// Lock escrow due to dispute
    pub fn lock_dispute(ctx: Context<LockDispute>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        // Only buyer or authorized admin can lock
        require!(
            ctx.accounts.buyer.key() == escrow.buyer,
            EscrowError::UnauthorizedBuyer
        );
        
        require!(
            escrow.status == EscrowStatus::Created,
            EscrowError::InvalidEscrowStatus
        );
        
        escrow.status = EscrowStatus::Locked;
        escrow.locked_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Escrow locked due to dispute for order: {}", escrow.order_id);
        
        Ok(())
    }

    /// Resolve dispute by admin (refund buyer)
    pub fn resolve_refund(ctx: Context<ResolveDispute>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        require!(
            escrow.status == EscrowStatus::Locked,
            EscrowError::EscrowNotLocked
        );
        
        // Transfer funds from escrow back to buyer
        let seeds = &[
            b"escrow".as_ref(),
            escrow.order_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow_account.to_account_info(),
                to: ctx.accounts.buyer.to_account_info(),
            },
            signer,
        );
        
        anchor_lang::system_program::transfer(cpi_context, escrow.amount)?;
        
        escrow.status = EscrowStatus::Refunded;
        escrow.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Dispute resolved - funds refunded to buyer: {}", escrow.order_id);
        
        Ok(())
    }

    /// Resolve dispute by admin (release to seller)
    pub fn resolve_release(ctx: Context<ResolveDispute>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        
        require!(
            escrow.status == EscrowStatus::Locked,
            EscrowError::EscrowNotLocked
        );
        
        // Transfer funds from escrow to seller
        let seeds = &[
            b"escrow".as_ref(),
            escrow.order_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow_account.to_account_info(),
                to: ctx.accounts.seller.to_account_info(),
            },
            signer,
        );
        
        anchor_lang::system_program::transfer(cpi_context, escrow.amount)?;
        
        escrow.status = EscrowStatus::Released;
        escrow.resolved_at = Some(Clock::get()?.unix_timestamp);
        
        msg!("Dispute resolved - funds released to seller: {}", escrow.order_id);
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(order_id: String, amount: u64, bump: u8)]
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
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub seller: AccountInfo<'info>,
    
    /// CHECK: Escrow PDA account
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmDelivery<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.order_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Seller receiving funds
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    
    /// CHECK: Escrow PDA account holding funds
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LockDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.order_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    pub buyer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.order_id.as_bytes()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Buyer account
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    
    /// CHECK: Seller account
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    
    /// CHECK: Escrow PDA account
    #[account(mut)]
    pub escrow_account: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub order_id: String,
    pub amount: u64,
    pub status: EscrowStatus,
    pub bump: u8,
    pub created_at: i64,
    pub locked_at: Option<i64>,
    pub released_at: Option<i64>,
    pub resolved_at: Option<i64>,
}

impl Escrow {
    pub const LEN: usize = 32 + 32 + (4 + 50) + 8 + 1 + 1 + 8 + (1 + 8) + (1 + 8) + (1 + 8);
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowStatus {
    Created,
    Locked,
    Released,
    Refunded,
}

#[error_code]
pub enum EscrowError {
    #[msg("Only the buyer can perform this action")]
    UnauthorizedBuyer,
    
    #[msg("Invalid escrow status for this operation")]
    InvalidEscrowStatus,
    
    #[msg("Escrow is not in locked status")]
    EscrowNotLocked,
    
    #[msg("Insufficient funds in escrow")]
    InsufficientFunds,
}
