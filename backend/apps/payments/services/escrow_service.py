"""
Blockchain Escrow Service
Integrates with Solana/ICP smart contracts for escrow management
"""
from decimal import Decimal
from typing import Dict, Optional
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class BlockchainEscrowService:
    """Service for blockchain escrow operations"""
    
    def __init__(self):
        solana_config = getattr(settings, 'SOLANA_CONFIG', {})
        self.network = solana_config.get('NETWORK', 'devnet')
        self.program_id = solana_config.get('ESCROW_PROGRAM_ID', '')
    
    async def create_escrow(
        self,
        order_id: str,
        buyer_wallet: str,
        seller_wallet: str,
        amount: Decimal,
        payment_reference: str,
        intasend_tx_id: str
    ) -> Dict:
        """
        Create escrow on blockchain
        
        Args:
            order_id: Unique order identifier
            buyer_wallet: Buyer wallet address
            seller_wallet: Seller wallet address
            amount: Amount to hold in escrow
            payment_reference: IntaSend payment reference
            intasend_tx_id: IntaSend transaction ID
        
        Returns:
            dict with transaction hash and escrow details
        """
        try:
            # Import Solana escrow service
            from apps.blockchain.services.solana_escrow import solana_escrow_service
            
            # Create escrow transaction
            result = await solana_escrow_service.create_escrow(
                order_id=order_id,
                buyer=buyer_wallet,
                seller=seller_wallet,
                amount_lamports=int(amount * 1_000_000),  # Convert to lamports
                metadata={
                    'payment_reference': payment_reference,
                    'intasend_tx_id': intasend_tx_id,
                    'platform': 'ProofCart'
                }
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'transaction_hash': result.get('signature'),
                    'escrow_address': result.get('escrow_pda'),
                    'blockchain': 'Solana',
                    'network': self.network
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Unknown error')
                }
        
        except Exception as e:
            logger.error(f"Escrow creation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def release_escrow(
        self,
        order_id: str,
        escrow_address: str,
        buyer_confirmation: bool = True
    ) -> Dict:
        """
        Release funds from escrow to seller
        
        Args:
            order_id: Order identifier
            escrow_address: Blockchain escrow address
            buyer_confirmation: Whether buyer confirmed delivery
        
        Returns:
            dict with release transaction hash
        """
        try:
            from apps.blockchain.services.solana_escrow import solana_escrow_service
            
            if not buyer_confirmation:
                return {
                    'success': False,
                    'error': 'Buyer confirmation required'
                }
            
            # Release escrow
            result = await solana_escrow_service.release_escrow(
                escrow_address=escrow_address,
                order_id=order_id
            )
            
            if result.get('success'):
                return {
                    'success': True,
                    'transaction_hash': result.get('signature'),
                    'released_at': result.get('timestamp')
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Release failed')
                }
        
        except Exception as e:
            logger.error(f"Escrow release failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def lock_escrow_for_dispute(
        self,
        escrow_address: str,
        order_id: str,
        dispute_reason: str
    ) -> Dict:
        """
        Lock escrow when dispute is opened
        
        Args:
            escrow_address: Blockchain escrow address
            order_id: Order identifier
            dispute_reason: Reason for dispute
        
        Returns:
            dict with lock status
        """
        try:
            from apps.blockchain.services.solana_escrow import solana_escrow_service
            
            # Lock escrow (prevent any releases)
            result = await solana_escrow_service.lock_escrow(
                escrow_address=escrow_address,
                reason=dispute_reason
            )
            
            return {
                'success': result.get('success', False),
                'transaction_hash': result.get('signature'),
                'locked_at': result.get('timestamp')
            }
        
        except Exception as e:
            logger.error(f"Escrow lock failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def refund_escrow(
        self,
        escrow_address: str,
        order_id: str
    ) -> Dict:
        """
        Refund escrow to buyer (dispute resolution)
        
        Args:
            escrow_address: Blockchain escrow address
            order_id: Order identifier
        
        Returns:
            dict with refund transaction hash
        """
        try:
            from apps.blockchain.services.solana_escrow import solana_escrow_service
            
            result = await solana_escrow_service.refund_escrow(
                escrow_address=escrow_address,
                order_id=order_id
            )
            
            return {
                'success': result.get('success', False),
                'transaction_hash': result.get('signature'),
                'refunded_at': result.get('timestamp')
            }
        
        except Exception as e:
            logger.error(f"Escrow refund failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_escrow_status(self, escrow_address: str) -> Dict:
        """
        Get current escrow status from blockchain
        
        Args:
            escrow_address: Blockchain escrow address
        
        Returns:
            dict with escrow status and details
        """
        try:
            from apps.blockchain.services.solana_escrow import solana_escrow_service
            
            result = await solana_escrow_service.get_escrow_details(escrow_address)
            
            return {
                'success': True,
                'status': result.get('status'),
                'amount': result.get('amount'),
                'buyer': result.get('buyer'),
                'seller': result.get('seller'),
                'created_at': result.get('created_at'),
                'metadata': result.get('metadata')
            }
        
        except Exception as e:
            logger.error(f"Failed to fetch escrow status: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
blockchain_escrow_service = BlockchainEscrowService()
