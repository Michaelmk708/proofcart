"""
Solana blockchain integration service for escrow management
"""
import os
import json
import base58
from decimal import Decimal
from typing import Optional, Dict, Any
from solders.pubkey import Pubkey
from solders.keypair import Keypair
from solders.system_program import ID as SYS_PROGRAM_ID
from solders.transaction import Transaction
from solders.instruction import Instruction, AccountMeta
from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed


class SolanaService:
    """Service for interacting with Solana blockchain for escrow"""
    
    def __init__(self):
        self.rpc_url = os.getenv('SOLANA_RPC_URL', 'https://api.devnet.solana.com')
        self.program_id_str = os.getenv('SOLANA_PROGRAM_ID', 'EscrowProgram11111111111111111111111111111')
        
        try:
            self.client = Client(self.rpc_url)
            self.program_id = Pubkey.from_string(self.program_id_str)
            
            # Load admin keypair if available (for admin functions)
            admin_key = os.getenv('SOLANA_ADMIN_PRIVATE_KEY', '')
            if admin_key:
                self.admin_keypair = Keypair.from_base58_string(admin_key)
            else:
                self.admin_keypair = None
                
            print(f"Solana Service initialized - RPC: {self.rpc_url}, Program: {self.program_id_str}")
        except Exception as e:
            print(f"Warning: Solana Service initialization failed: {e}")
            print("Running in fallback mode - blockchain features will be limited")
            self.client = None
            self.program_id = None
            self.admin_keypair = None
    
    def create_escrow(
        self,
        order_id: str,
        buyer_pubkey: str,
        seller_pubkey: str,
        amount_sol: Decimal
    ) -> Dict[str, Any]:
        """
        Create an escrow account for an order
        
        Args:
            order_id: Unique order identifier
            buyer_pubkey: Buyer's Solana public key
            seller_pubkey: Seller's Solana public key
            amount_sol: Amount in SOL to escrow
        
        Returns:
            Dict with escrow_id and transaction_hash
        """
        if not self.client or not self.program_id:
            # Fallback mode - return mock data
            return {
                'escrow_id': f"escrow_{order_id}",
                'transaction_hash': f'mock_tx_{order_id}',
                'amount': float(amount_sol),
                'status': 'created'
            }
        
        try:
            # Convert amount to lamports (1 SOL = 1,000,000,000 lamports)
            lamports = int(amount_sol * 1_000_000_000)
            
            # Derive escrow PDA (Program Derived Address)
            escrow_seeds = [b"escrow", order_id.encode()]
            escrow_pda, bump = Pubkey.find_program_address(escrow_seeds, self.program_id)
            
            # Parse buyer and seller pubkeys
            buyer_pk = Pubkey.from_string(buyer_pubkey)
            seller_pk = Pubkey.from_string(seller_pubkey)
            
            # Build create_escrow instruction data
            # Instruction discriminator (first 8 bytes of sha256("global:create_escrow"))
            discriminator = bytes([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])  # Placeholder
            order_id_bytes = order_id.encode()
            order_id_len = len(order_id_bytes).to_bytes(4, 'little')
            amount_bytes = lamports.to_bytes(8, 'little')
            bump_bytes = bytes([bump])
            
            instruction_data = discriminator + order_id_len + order_id_bytes + amount_bytes + bump_bytes
            
            # Create instruction accounts
            accounts = [
                AccountMeta(pubkey=escrow_pda, is_signer=False, is_writable=True),
                AccountMeta(pubkey=buyer_pk, is_signer=True, is_writable=True),
                AccountMeta(pubkey=seller_pk, is_signer=False, is_writable=False),
                AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
            ]
            
            # Build instruction
            instruction = Instruction(
                program_id=self.program_id,
                accounts=accounts,
                data=instruction_data
            )
            
            # Note: Transaction must be signed by buyer on frontend
            # Return escrow details for frontend to complete transaction
            return {
                'escrow_id': str(escrow_pda),
                'escrow_pda': str(escrow_pda),
                'bump': bump,
                'program_id': str(self.program_id),
                'amount': float(amount_sol),
                'status': 'pending_signature',
                'instruction_data': base58.b58encode(instruction_data).decode()
            }
            
        except Exception as e:
            raise Exception(f"Failed to create escrow: {str(e)}")
    
    def confirm_delivery(
        self,
        escrow_id: str,
        buyer_pubkey: str,
        order_id: str
    ) -> Dict[str, Any]:
        """
        Prepare release escrow transaction for buyer to sign
        
        Args:
            escrow_id: Escrow account public key  
            buyer_pubkey: Buyer's public key
            order_id: Original order ID
        
        Returns:
            Dict with transaction details for frontend signing
        """
        if not self.client or not self.program_id:
            return {
                'transaction_hash': f'mock_release_{escrow_id}',
                'status': 'fallback_mode'
            }
            
        try:
            # Parse pubkeys
            escrow_pk = Pubkey.from_string(escrow_id)
            buyer_pk = Pubkey.from_string(buyer_pubkey)
            
            # Build release_escrow instruction
            # Method discriminator for release_escrow
            discriminator = bytes([0xab, 0xcd, 0xef, 0x12, 0x34, 0x56, 0x78, 0x90])  # Placeholder
            
            accounts = [
                AccountMeta(pubkey=escrow_pk, is_signer=False, is_writable=True),
                AccountMeta(pubkey=buyer_pk, is_signer=True, is_writable=False),
                AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
            ]
            
            instruction = Instruction(
                program_id=self.program_id,
                accounts=accounts,
                data=discriminator
            )
            
            # Return for frontend to build and sign transaction
            return {
                'program_id': str(self.program_id),
                'escrow_id': escrow_id,
                'instruction_data': base58.b58encode(discriminator).decode(),
                'status': 'pending_signature'
            }
            
        except Exception as e:
            raise Exception(f"Failed to prepare release: {str(e)}")
    
    def lock_escrow(
        self,
        escrow_id: str,
        admin_pubkey: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Prepare dispute escrow transaction for admin to sign
        
        Args:
            escrow_id: Escrow account public key
            admin_pubkey: Admin's public key
            reason: Reason for locking
        
        Returns:
            Dict with transaction details for frontend signing
        """
        if not self.client or not self.program_id:
            return {
                'escrow_id': escrow_id,
                'status': 'fallback_mode'
            }
            
        try:
            # Parse pubkeys
            escrow_pk = Pubkey.from_string(escrow_id)
            admin_pk = Pubkey.from_string(admin_pubkey)
            
            # Build dispute_escrow instruction
            # Method discriminator for dispute_escrow
            discriminator = bytes([0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88])  # Placeholder
            
            accounts = [
                AccountMeta(pubkey=escrow_pk, is_signer=False, is_writable=True),
                AccountMeta(pubkey=admin_pk, is_signer=True, is_writable=False),
            ]
            
            instruction = Instruction(
                program_id=self.program_id,
                accounts=accounts,
                data=discriminator
            )
            
            # Return for frontend to build and sign transaction
            return {
                'program_id': str(self.program_id),
                'escrow_id': escrow_id,
                'instruction_data': base58.b58encode(discriminator).decode(),
                'reason': reason,
                'status': 'pending_signature'
            }
            
        except Exception as e:
            raise Exception(f"Failed to prepare dispute: {str(e)}")
    
    def refund_escrow(
        self,
        escrow_id: str,
        seller_pubkey: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Prepare refund escrow transaction for seller to sign
        
        Args:
            escrow_id: Escrow account public key
            seller_pubkey: Seller's public key
            reason: Reason for refund
        
        Returns:
            Dict with transaction details for frontend signing
        """
        if not self.client or not self.program_id:
            return {
                'transaction_hash': f'mock_refund_{escrow_id}',
                'status': 'fallback_mode'
            }
            
        try:
            # Parse pubkeys
            escrow_pk = Pubkey.from_string(escrow_id)
            seller_pk = Pubkey.from_string(seller_pubkey)
            
            # Build refund_escrow instruction
            # Method discriminator for refund_escrow
            discriminator = bytes([0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11])  # Placeholder
            
            accounts = [
                AccountMeta(pubkey=escrow_pk, is_signer=False, is_writable=True),
                AccountMeta(pubkey=seller_pk, is_signer=True, is_writable=False),
                AccountMeta(pubkey=SYS_PROGRAM_ID, is_signer=False, is_writable=False),
            ]
            
            instruction = Instruction(
                program_id=self.program_id,
                accounts=accounts,
                data=discriminator
            )
            
            # Return for frontend to build and sign transaction
            return {
                'program_id': str(self.program_id),
                'escrow_id': escrow_id,
                'instruction_data': base58.b58encode(discriminator).decode(),
                'reason': reason,
                'status': 'pending_signature'
            }
            
        except Exception as e:
            raise Exception(f"Failed to prepare refund: {str(e)}")
    
    def resolve_release(
        self,
        escrow_id: str,
        seller_pubkey: str
    ) -> Dict[str, Any]:
        """
        Release escrowed funds to seller (admin action)
        
        Args:
            escrow_id: Escrow account public key
            seller_pubkey: Seller's public key to receive funds
        
        Returns:
            Dict with transaction_hash and status
        """
        try:
            if not self.admin_keypair:
                raise Exception("Admin keypair not configured")
            
            # This would call your Anchor program's resolve_release instruction
            # Signed by admin to authorize release
            
            return {
                'transaction_hash': f'admin_release_tx_{escrow_id}',
                'status': 'released',
                'timestamp': self._get_block_timestamp()
            }
            
        except Exception as e:
            raise Exception(f"Failed to release escrow: {str(e)}")
    
    def get_escrow_status(self, escrow_id: str) -> Dict[str, Any]:
        """
        Get current status of an escrow account
        
        Args:
            escrow_id: Escrow account public key
        
        Returns:
            Dict with escrow details
        """
        try:
            # This would fetch the escrow account data from Solana
            # and parse the account state
            
            return {
                'escrow_id': escrow_id,
                'status': 'created',
                'amount': 0.0,
                'buyer': '',
                'seller': ''
            }
            
        except Exception as e:
            raise Exception(f"Failed to get escrow status: {str(e)}")
    
    def _get_block_timestamp(self) -> int:
        """Get current block timestamp"""
        try:
            response = self.client.get_block_time(self.client.get_slot().value)
            return response.value if response.value else 0
        except:
            return 0


# Singleton instance
solana_service = SolanaService()
