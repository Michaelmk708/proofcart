"""
IntaSend Payment Service
Handles payment initialization, webhook validation, and payouts
"""
import hashlib
import hmac
from decimal import Decimal
from typing import Dict, Optional
from intasend import APIService


class IntaSendService:
    """Service for IntaSend payment operations"""
    
    def __init__(self):
        # Lazy load settings to avoid initialization issues
        from django.conf import settings
        self.publishable_key = getattr(settings, 'INTASEND_PUBLISHABLE_KEY', '')
        self.secret_key = getattr(settings, 'INTASEND_SECRET_KEY', '')
        self.test_mode = getattr(settings, 'INTASEND_TEST_MODE', True)
        
        # Initialize IntaSend API only if keys are configured
        if self.secret_key and self.publishable_key:
            self.api = APIService(
                token=self.secret_key,
                publishable_key=self.publishable_key,
                test=self.test_mode
            )
        else:
            self.api = None
    
    def create_payment_link(
        self,
        amount: Decimal,
        currency: str,
        email: str,
        phone_number: str,
        reference: str,
        redirect_url: Optional[str] = None,
        webhook_url: Optional[str] = None
    ) -> Dict:
        """
        Create a payment link for checkout
        
        Args:
            amount: Payment amount
            currency: Currency code (KES, USD, etc.)
            email: Customer email
            phone_number: Customer phone
            reference: Unique transaction reference
            redirect_url: URL to redirect after payment
            webhook_url: URL for payment notifications
        
        Returns:
            dict with payment link and transaction details
        """
        if not self.api:
            return {
                'success': False,
                'error': 'IntaSend API not configured. Please check INTASEND_PUBLISHABLE_KEY and INTASEND_SECRET_KEY in settings.'
            }
        
        try:
            from django.conf import settings
            # Initialize checkout service using the Collection API
            # IntaSend SDK uses 'Collection' not 'Checkout'
            from intasend.collection import Collection
            
            checkout = Collection(
                token=self.secret_key,
                publishable_key=self.publishable_key,
                test=self.test_mode
            )
            
            # Get frontend URL for redirect
            frontend_url = settings.FRONTEND_URL.split(',')[0] if hasattr(settings, 'FRONTEND_URL') else 'http://localhost:8081'
            
            # Create checkout session
            response = checkout.create(
                amount=float(amount),
                currency=currency,
                email=email,
                phone_number=phone_number,
                api_ref=reference,
                redirect_url=redirect_url or f"{frontend_url}/orders",
                webhook_url=webhook_url
            )
            
            return {
                'success': True,
                'payment_link': response.get('url'),
                'payment_id': response.get('id'),
                'reference': reference,
                'raw_response': response
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_payment(self, payment_id: str) -> Dict:
        """
        Verify payment status
        
        Args:
            payment_id: IntaSend payment ID
        
        Returns:
            dict with payment status and details
        """
        try:
            from intasend.collection import Collection
            
            checkout = Collection(
                token=self.secret_key,
                publishable_key=self.publishable_key,
                test=self.test_mode
            )
            response = checkout.retrieve(payment_id)
            
            return {
                'success': True,
                'status': response.get('state'),
                'payment_data': response
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def validate_webhook_signature(
        self,
        payload: str,
        signature: str
    ) -> bool:
        """
        Validate webhook signature from IntaSend
        
        Args:
            payload: Raw webhook payload
            signature: Signature from X-IntaSend-Signature header
        
        Returns:
            bool indicating if signature is valid
        """
        from django.conf import settings
        webhook_secret = getattr(settings, 'INTASEND_WEBHOOK_SECRET', '')
        
        if not webhook_secret:
            # If no webhook secret configured, skip validation (dev mode)
            return True
        
        try:
            # Create HMAC signature
            expected_signature = hmac.new(
                webhook_secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(expected_signature, signature)
        
        except Exception:
            return False
    
    def create_payout(
        self,
        amount: Decimal,
        account: str,
        account_type: str,  # 'MPESA', 'BANK', etc.
        name: str,
        narrative: Optional[str] = None
    ) -> Dict:
        """
        Create payout to seller
        
        Args:
            amount: Payout amount
            account: Account identifier (phone, bank account)
            account_type: Type of account
            name: Recipient name
            narrative: Payment description
        
        Returns:
            dict with payout status and details
        """
        try:
            # Initialize payout service
            from intasend.transfer import Transfer
            
            payout = Transfer(
                token=self.secret_key,
                publishable_key=self.publishable_key,
                test=self.test_mode
            )
            
            # Create payout
            response = payout.mpesa(
                amount=float(amount),
                account=account,
                name=name,
                narrative=narrative or 'ProofCart seller payment'
            ) if account_type == 'MPESA' else None
            
            if not response:
                return {
                    'success': False,
                    'error': 'Unsupported payout account type'
                }
            
            return {
                'success': True,
                'payout_id': response.get('id'),
                'status': response.get('status'),
                'raw_response': response
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def check_payout_status(self, payout_id: str) -> Dict:
        """
        Check payout status
        
        Args:
            payout_id: IntaSend payout ID
        
        Returns:
            dict with payout status
        """
        try:
            from intasend.transfer import Transfer
            
            payout = Transfer(
                token=self.secret_key,
                publishable_key=self.publishable_key,
                test=self.test_mode
            )
            response = payout.retrieve(payout_id)
            
            return {
                'success': True,
                'status': response.get('status'),
                'payout_data': response
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def initiate_refund(
        self,
        payment_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> Dict:
        """
        Initiate refund for a payment
        
        Args:
            payment_id: Original payment ID
            amount: Refund amount (None for full refund)
            reason: Refund reason
        
        Returns:
            dict with refund status
        """
        try:
            # Initialize refund service
            from intasend.refund import Refund as IntaSendRefund
            
            refund = IntaSendRefund(
                token=self.secret_key,
                publishable_key=self.publishable_key,
                test=self.test_mode
            )
            
            # Create refund
            response = refund.create(
                invoice_id=payment_id,
                amount=float(amount) if amount else None,
                reason=reason or 'Dispute resolved in buyer favor'
            )
            
            return {
                'success': True,
                'refund_id': response.get('id'),
                'status': response.get('status'),
                'raw_response': response
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
intasend_service = IntaSendService()
