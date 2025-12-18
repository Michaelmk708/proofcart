import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import EscrowFlow from '@/components/EscrowFlow';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Wallet,
  ArrowLeft,
  Package,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { apiService } from "@/lib/api";
import { phantomWallet } from "@/lib/wallet/phantom";

interface DeliveryInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<'delivery' | 'payment' | 'processing' | 'success'>(items.length > 0 ? 'delivery' : 'delivery');
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: user?.username || '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mpesa' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [escrowTxHash, setEscrowTxHash] = useState<string | null>(null);
  const [escrowId, setEscrowId] = useState<string | null>(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  const shippingFee = 500;
  const escrowFee = totalPrice * 0.02;
  const grandTotal = totalPrice + shippingFee + escrowFee;

  // Redirect if cart is empty or not authenticated
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate delivery info
    if (!deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStep('payment');
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Get user email from auth context or use a default
      const userEmail = user?.email || `${user?.username}@proofcart.com`;
      
      // Format phone number - ensure it starts with +254 or convert from 07xx format
      let formattedPhone = deliveryInfo.phone.trim();
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+254' + formattedPhone;
      }
      
      if (paymentMethod === 'crypto') {
        // Blockchain escrow payment flow
        if (!phantomWallet.isPhantomInstalled()) {
          toast.error('Please install Phantom wallet');
          window.open('https://phantom.app/', '_blank');
          setIsProcessing(false);
          return;
        }

        // Connect wallet if not connected
        const walletAddress = phantomWallet.getWalletAddress();
        if (!walletAddress) {
          await phantomWallet.connect();
        }

        // Create order in backend - this will use IntaSend for crypto too
        toast.info('Creating order...');
        
        // For now, use the first item (multi-item checkout can be added later)
        const firstItem = items[0];
        const orderResponse = await apiService.createOrder({
          product_id: firstItem.product.id,
          quantity: firstItem.quantity,
          shipping_address: `${deliveryInfo.address}, ${deliveryInfo.city}`,
          buyer_phone: formattedPhone,
          buyer_email: userEmail,
          payment_method: 'IntaSend'
        });
        
        if (orderResponse.success) {
          setOrderId(orderResponse.order_id);
          
          // Create escrow transaction on blockchain
          toast.info('Creating blockchain escrow...');
          try {
            // Try to fetch product details to find seller wallet address
            const productDetails = await apiService.getProduct(firstItem.product.id);
              const sellerObj = (productDetails as unknown as Record<string, unknown>)['seller'] as Record<string, unknown> | undefined;
              const sellerAddress = sellerObj ? (String(sellerObj['wallet_address'] ?? sellerObj['walletAddress'] ?? '') ) : '';
            if (!sellerAddress) {
              toast.warning('Seller wallet not found — please ask seller to connect their wallet');
            } else {
              const txHash = await phantomWallet.createEscrowTransaction(sellerAddress, grandTotal, orderResponse.order_id!);
              // Create escrow record in backend
              try {
                const escrowResp = await apiService.createEscrow({ orderId: orderResponse.order_id!, buyerAddress: walletAddress || '', sellerAddress: sellerAddress, amount: grandTotal });
                setEscrowId(escrowResp.id || escrowResp.escrowId || null);
              } catch (e) {
                console.warn('Failed to persist escrow to backend', e);
              }
              setEscrowTxHash(txHash);
              setShowEscrowModal(true);
              toast.success('Blockchain escrow created: ' + txHash);
            }
          } catch (err) {
            console.warn('Failed to create blockchain escrow', err);
          }

          toast.success('🎉 Payment successful! Funds held in escrow.');
          setStep('success');
          clearCart();
        }

      } else {
        // IntaSend payment flow (Card & M-Pesa)
        toast.info('Creating payment order...');
        
        // Create order for the first item (multi-item support can be added later)
        const firstItem = items[0];
        const orderResponse = await apiService.createOrder({
          product_id: firstItem.product.id,
          quantity: firstItem.quantity,
          shipping_address: `${deliveryInfo.address}, ${deliveryInfo.city}`,
          buyer_phone: formattedPhone,
          buyer_email: userEmail,
          payment_method: 'IntaSend'
        });

        if (orderResponse.success && orderResponse.payment_link) {
          // Store order ID for later
          setOrderId(orderResponse.order_id);
          
          toast.success('Order created! Redirecting to payment...');
          
          // Redirect to IntaSend payment page
          setTimeout(() => {
            window.location.href = orderResponse.payment_link;
          }, 1500);
        } else {
          throw new Error('Failed to create payment order');
        }
      }

    } catch (error) {
      console.error('Payment error:', error);
      let errorMessage = 'Payment failed. Please try again.';
      if (typeof error === 'object' && error !== null) {
        const e = error as { response?: { data?: { error?: string } }; message?: string };
        errorMessage = e.response?.data?.error || e.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/cart')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
            <p className="text-gray-600">Complete your purchase with blockchain escrow protection</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'delivery' ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'delivery' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span>Delivery</span>
            </div>
            <div className="h-0.5 w-16 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step === 'payment' || step === 'processing' ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' || step === 'processing' || step === 'success' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span>Payment</span>
            </div>
            <div className="h-0.5 w-16 bg-gray-300" />
            <div className={`flex items-center gap-2 ${step === 'success' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'success' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span>Complete</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Delivery Information Step */}
              {step === 'delivery' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleDeliverySubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            value={deliveryInfo.fullName}
                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="0712345678"
                            value={deliveryInfo.phone}
                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Input
                          id="address"
                          placeholder="Street address, building, apartment"
                          value={deliveryInfo.address}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          placeholder="Nairobi"
                          value={deliveryInfo.city}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special delivery instructions..."
                          value={deliveryInfo.notes}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600">
                        Continue to Payment
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Step */}
              {step === 'payment' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={(value: string) => setPaymentMethod(value as 'card' | 'mpesa' | 'crypto')}>
                      {/* Card Payment */}
                      <Card className={`cursor-pointer ${paymentMethod === 'card' ? 'border-yellow-500 border-2' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="card" id="card" />
                            <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-3">
                              <CreditCard className="h-6 w-6 text-blue-600" />
                              <div>
                                <p className="font-semibold">Credit/Debit Card</p>
                                <p className="text-sm text-gray-600">Visa, Mastercard accepted</p>
                              </div>
                            </Label>
                          </div>
                        </CardContent>
                      </Card>

                      {/* M-Pesa */}
                      <Card className={`cursor-pointer ${paymentMethod === 'mpesa' ? 'border-yellow-500 border-2' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="mpesa" id="mpesa" />
                            <Label htmlFor="mpesa" className="flex-1 cursor-pointer flex items-center gap-3">
                              <Smartphone className="h-6 w-6 text-green-600" />
                              <div>
                                <p className="font-semibold">M-Pesa</p>
                                <p className="text-sm text-gray-600">Pay via mobile money</p>
                              </div>
                            </Label>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Crypto */}
                      <Card className={`cursor-pointer ${paymentMethod === 'crypto' ? 'border-yellow-500 border-2' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="crypto" id="crypto" />
                            <Label htmlFor="crypto" className="flex-1 cursor-pointer flex items-center gap-3">
                              <Wallet className="h-6 w-6 text-purple-600" />
                              <div>
                                <p className="font-semibold">Cryptocurrency (Solana)</p>
                                <p className="text-sm text-gray-600">Blockchain escrow protection</p>
                              </div>
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    </RadioGroup>

                    {/* Escrow Info */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheck className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Escrow Protection</h4>
                            <p className="text-sm text-blue-800">
                              Your payment is securely held in escrow and released only when you confirm receipt 
                              and verify the product's authenticity via QR code scan.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* IntaSend Trust Badge */}
                    <div className="flex justify-center">
                      <div className="text-center">
                        <a href="https://intasend.com/security" target="_blank" rel="noopener noreferrer">
                          <img 
                            src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-v-light.png" 
                            alt="IntaSend Secure Payments (PCI-DSS Compliant)" 
                            className="w-[375px] max-w-full mx-auto"
                          />
                        </a>
                        <a 
                          href="https://intasend.com/security" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block text-gray-600 no-underline text-sm mt-2 hover:text-gray-800"
                        >
                          <strong>Secured by IntaSend Payments</strong>
                        </a>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep('delivery')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay KES ${grandTotal.toLocaleString()}`
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <Card className="border-green-500 border-2">
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
                    <p className="text-gray-600 mb-6">
                      Your order has been confirmed and payment is securely held in escrow.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-1">Order ID</p>
                      <p className="font-mono font-bold text-lg">{orderId || 'ORD-' + Date.now()}</p>
                    </div>
                    <div className="space-y-3">
                      <Button 
                        size="lg"
                        className="w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600"
                        onClick={() => navigate('/dashboard')}
                      >
                        View Order Status
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/marketplace')}
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary - Sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card className="border-2 border-yellow-300">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.productId} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-full h-full p-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">{item.product.name}</p>
                            <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold">KES {(item.product.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>KES {totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>KES {shippingFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Escrow Fee (2%)</span>
                        <span>KES {escrowFee.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>KES {grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {paymentMethod === 'crypto' && step === 'payment' && (
                      <div className="bg-purple-50 rounded p-3">
                        <p className="text-xs text-purple-800">
                          <ShieldCheck className="h-3 w-3 inline mr-1" />
                          Blockchain escrow ensures your funds are safe until delivery
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Checkout;
