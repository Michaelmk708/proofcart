import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle,
  Package
} from "lucide-react";
import { toast } from "sonner";

const Cart = () => {
  const navigate = useNavigate();
  const { items, itemCount, totalPrice, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    navigate('/checkout');
  };

  const handleQuantityChange = (productId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} units available`);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-8">
              Start shopping for blockchain-verified products and build your trust-protected collection.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/marketplace')}
              className="bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Browse Marketplace
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const shippingFee = 500; // Fixed shipping for demo
  const escrowFee = totalPrice * 0.02; // 2% escrow fee
  const grandTotal = totalPrice + shippingFee + escrowFee;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 py-12">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
            <p className="text-gray-600">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {/* Trust Banner */}
          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Blockchain-Protected Shopping</h3>
                  <p className="text-sm text-green-800">
                    All products are blockchain-verified for authenticity and escrow-protected for secure payments. 
                    Your payment is held safely until you confirm receipt and authenticity.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                const serialNumber = (product as any).serial_number || product.serialNumber;
                const sellerName = (product as any).seller_username || product.sellerName || 'ProofCart Seller';
                const isVerified = (product as any).verified || product.nftId;
                
                return (
                  <Card key={item.productId} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-full h-full p-6 text-gray-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Sold by <span className="font-medium">{sellerName}</span>
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Verification Badge */}
                          {isVerified && (
                            <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Blockchain Verified</span>
                            </div>
                          )}

                          {/* Quantity and Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1, product.stock)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1, product.stock)}
                                className="w-16 text-center"
                                min="1"
                                max={product.stock}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1, product.stock)}
                                disabled={item.quantity >= product.stock}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <span className="text-xs text-gray-500 ml-2">
                                ({product.stock} available)
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">KES {product.price.toLocaleString()}</p>
                              <p className="font-bold text-lg text-gray-900">
                                KES {(product.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary - Sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <Card className="border-2 border-yellow-300 shadow-lg">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal ({itemCount} items)</span>
                        <span>KES {totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping Fee</span>
                        <span>KES {shippingFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span className="flex items-center gap-1">
                          Escrow Fee (2%)
                          <AlertCircle className="h-3 w-3 text-gray-400" />
                        </span>
                        <span>KES {escrowFee.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>KES {grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-800">
                        <ShieldCheck className="h-3 w-3 inline mr-1" />
                        Your payment is securely held in escrow and released only when the product is verified authentic.
                      </p>
                    </div>

                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-white font-semibold"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => navigate('/marketplace')}
                    >
                      Continue Shopping
                    </Button>
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

export default Cart;
