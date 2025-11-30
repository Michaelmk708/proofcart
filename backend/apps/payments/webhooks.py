"""
IntaSend Webhook Handler
Processes payment confirmations and triggers escrow creation
"""
import json
import asyncio
import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db import transaction as db_transaction

from apps.payments.models import Order, PaymentTransaction, EscrowRecord
from apps.payments.services.intasend_service import intasend_service
from apps.payments.services.escrow_service import blockchain_escrow_service

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def intasend_webhook(request):
    """
    Step 2: Handle IntaSend webhook notifications
    
    Webhook payload structure:
    {
        "id": "payment_id",
        "invoice_id": "invoice_123",
        "state": "COMPLETE",
        "api_ref": "PC-ABC123",
        "value": "1000.00",
        "account": "254712345678",
        "meta": {...}
    }
    """
    try:
        # Get raw payload
        payload = request.body.decode('utf-8')
        signature = request.headers.get('X-IntaSend-Signature', '')
        
        # Validate webhook signature
        if not intasend_service.validate_webhook_signature(payload, signature):
            logger.warning("Invalid webhook signature")
            return HttpResponse("Invalid signature", status=401)
        
        # Parse payload
        data = json.loads(payload)
        
        logger.info(f"Webhook received: {data.get('state')} for {data.get('api_ref')}")
        
        # Get transaction reference
        transaction_ref = data.get('api_ref')
        payment_state = data.get('state')
        payment_id = data.get('id') or data.get('invoice_id')
        
        if not transaction_ref:
            logger.error("No transaction reference in webhook")
            return HttpResponse("Missing transaction reference", status=400)
        
        # Find order
        try:
            order = Order.objects.select_for_update().get(
                transaction_reference=transaction_ref
            )
        except Order.DoesNotExist:
            logger.error(f"Order not found for reference: {transaction_ref}")
            return HttpResponse("Order not found", status=404)
        
        with db_transaction.atomic():
            # Update payment transaction
            payment_tx = PaymentTransaction.objects.filter(
                order=order,
                transaction_type='PAYMENT'
            ).first()
            
            if payment_state == 'COMPLETE':
                # Payment successful
                order.status = 'PAYMENT_RECEIVED'
                order.payment_completed_at = timezone.now()
                order.intasend_payment_id = payment_id
                order.save()
                
                if payment_tx:
                    payment_tx.status = 'COMPLETED'
                    payment_tx.completed_at = timezone.now()
                    payment_tx.raw_response = data
                    payment_tx.save()
                
                logger.info(f"Payment completed for order {order.order_id}")
                
                # Step 3: Create blockchain escrow
                _create_escrow_for_order(order)
            
            elif payment_state in ['FAILED', 'CANCELLED']:
                # Payment failed
                order.status = 'PAYMENT_FAILED'
                order.save()
                
                # Restore stock
                product = order.product
                product.stock += order.quantity
                product.save()
                
                if payment_tx:
                    payment_tx.status = 'FAILED'
                    payment_tx.raw_response = data
                    payment_tx.save()
                
                logger.info(f"Payment failed for order {order.order_id}")
            
            else:
                # Payment processing
                if payment_tx:
                    payment_tx.status = 'PROCESSING'
                    payment_tx.raw_response = data
                    payment_tx.save()
        
        return HttpResponse("OK", status=200)
    
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return HttpResponse("Invalid JSON", status=400)
    
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return HttpResponse(f"Error: {str(e)}", status=500)


def _create_escrow_for_order(order):
    """
    Step 3: Create blockchain escrow after payment confirmation
    """
    try:
        # Get wallet addresses
        buyer_wallet = getattr(order.buyer, 'wallet_address', 'BUYER_WALLET_PLACEHOLDER')
        seller_wallet = getattr(order.seller, 'wallet_address', 'SELLER_WALLET_PLACEHOLDER')
        
        # Create escrow on blockchain
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        escrow_result = loop.run_until_complete(
            blockchain_escrow_service.create_escrow(
                order_id=str(order.order_id),
                buyer_wallet=buyer_wallet,
                seller_wallet=seller_wallet,
                amount=order.total_amount,
                payment_reference=order.transaction_reference,
                intasend_tx_id=order.intasend_payment_id
            )
        )
        loop.close()
        
        if escrow_result.get('success'):
            # Create escrow record
            escrow = EscrowRecord.objects.create(
                order=order,
                blockchain=escrow_result.get('blockchain', 'Solana'),
                escrow_address=escrow_result.get('escrow_address'),
                creation_tx_hash=escrow_result['transaction_hash'],
                buyer_wallet=buyer_wallet,
                seller_wallet=seller_wallet,
                amount_held=order.total_amount,
                status='HELD',
                smart_contract_data=escrow_result
            )
            
            # Update order
            order.blockchain_escrow_tx_id = escrow_result['transaction_hash']
            order.escrow_created_at = timezone.now()
            order.status = 'FUNDS_IN_ESCROW'
            order.save()
            
            logger.info(f"Escrow created for order {order.order_id}: {escrow.creation_tx_hash}")
        else:
            logger.error(f"Escrow creation failed: {escrow_result.get('error')}")
            # Keep order in PAYMENT_RECEIVED status for manual intervention
    
    except Exception as e:
        logger.error(f"Escrow creation error: {str(e)}")
