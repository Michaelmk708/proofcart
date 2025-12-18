import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, CheckCircle2, AlertCircle, ExternalLink, Star } from 'lucide-react';
import type { Order } from '@/types';
import { apiService } from '@/lib/api';
import { phantomWallet } from '@/lib/wallet/phantom';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';

const BuyerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const data = await apiService.getMyPurchases();
      // Ensure data is an array
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Failed to fetch orders:', error);
      const message = error instanceof Error ? error.message : 'Failed to load orders';
      toast.error(message);
      setOrders([]); // Set to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async (order: Order) => {
    if (!order.escrowId) {
      toast.error('No escrow found for this order');
      return;
    }

    try {
      // Release escrow on Solana
      const txHash = await phantomWallet.releaseEscrow(order.escrowId, order.orderId);
      
      // Update order status in backend
      await apiService.confirmDelivery({
        order_id: order.orderId,
        confirmed: true,
      });
      
      toast.success('Delivery confirmed! Funds released to seller.');
      fetchOrders(); // Refresh orders
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to confirm delivery';
      toast.error(message);
    }
  };

  const handleDisputeOrder = async (order: Order) => {
    const reason = prompt('Please describe the issue:');
    if (!reason) return;

    try {
      if (order.escrowId) {
        await phantomWallet.lockEscrow(order.escrowId, order.orderId, reason);
      }
      
      await apiService.disputeOrder(order.orderId, reason);
      
      toast.success('Dispute filed successfully');
      fetchOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to file dispute';
      toast.error(message);
    }
  };

  const handleBuyAgain = async (order: Order) => {
    try {
      const product = await apiService.getProduct(order.productId);
      if (product) {
        addToCart(product, 1);
        toast.success('Added item to cart');
        navigate('/cart');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to re-add product to cart';
      toast.error(message);
    }
  };

  const openReviewDialog = (order: Order) => {
    setReviewingOrder(order);
    setReviewRating(5);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!reviewingOrder) return;
    setIsSubmittingReview(true);
    try {
      await apiService.submitProductReview(reviewingOrder.productId, {
        rating: reviewRating,
        comment: reviewComment,
        order_id: reviewingOrder.orderId,
      });
      toast.success('Thank you for your review!');
      setReviewDialogOpen(false);
      setReviewingOrder(null);
      fetchOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit review';
      toast.error(message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'paid':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
      case 'completed':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'disputed':
      case 'cancelled':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'paid':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'delivered':
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'disputed':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 border-red-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username}!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-3xl">{orders?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">
                {orders?.filter(o => ['pending', 'paid', 'shipped'].includes(o.status)).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">
                {orders?.filter(o => o.status === 'completed').length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Spent</CardDescription>
              <CardTitle className="text-3xl">
                ${orders?.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2) || '0.00'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
            <CardDescription>
              Track and manage your purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4 mt-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No orders yet</p>
                    <Button className="mt-4" onClick={() => navigate('/marketplace')}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{order.productName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Order #{order.orderId}
                                </p>
                              </div>
                              <Badge className={getStatusColor(order.status)}>
                                <span className="mr-1">{getStatusIcon(order.status)}</span>
                                {order.status.toUpperCase()}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-muted-foreground">Quantity:</span> {order.quantity}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total:</span> ${order.totalPrice.toFixed(2)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Order Date:</span>{' '}
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                              {order.trackingNumber && (
                                <div>
                                  <span className="text-muted-foreground">Tracking:</span> {order.trackingNumber}
                                </div>
                              )}
                            </div>

                            {order.escrowStatus && (
                              <div className="mb-4">
                                <span className="text-sm text-muted-foreground">Escrow Status:</span>
                                <Badge variant="outline" className="ml-2">
                                  {order.escrowStatus}
                                </Badge>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {order.status === 'shipped' && (
                                <Button
                                  onClick={() => handleConfirmDelivery(order)}
                                  size="sm"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Confirm Delivery
                                </Button>
                              )}
                              {['delivered', 'completed'].includes(order.status) && !order?.reviewed && (
                                <Button size="sm" onClick={() => openReviewDialog(order)}>
                                  <Star className="h-4 w-4 mr-2" />
                                  Leave Review
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => {
                                const serial = order.serialNumber || order.verificationSerial || '';
                                if (serial) {
                                  window.location.href = `/verify/${encodeURIComponent(serial)}`;
                                } else {
                                  // Fallback: open product detail page
                                  window.location.href = `/product/${order.productId}`;
                                }
                              }}>
                                Verify Product
                              </Button>
                              
                              {['paid', 'shipped'].includes(order.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDisputeOrder(order)}
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  File Dispute
                                </Button>
                              )}
                              
                              {order.transactionHash && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a
                                    href={`https://explorer.solana.com/tx/${order.transactionHash}?cluster=devnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    View on Explorer
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </a>
                                </Button>
                                )}
                                {order.sellerEmail && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={`mailto:${order.sellerEmail}`}>Contact Seller</a>
                                  </Button>
                                )}
                                {order.sellerPhone && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={`tel:${order.sellerPhone}`}>Call Seller</a>
                                  </Button>
                                )}
                                {['completed', 'delivered'].includes(order.status) && (
                                  <Button size="sm" onClick={() => handleBuyAgain(order)}>Buy Again</Button>
                                )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              <TabsContent value="active" className="space-y-4 mt-4">
                {orders.filter(o => ['pending', 'paid', 'shipped'].includes(o.status)).map((order) => (
                  <div key={order.id}>Order content (same as above)</div>
                ))}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4 mt-4">
                {orders.filter(o => o.status === 'completed').map((order) => (
                  <div key={order.id}>Order content (same as above)</div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {/* Review Dialog */}
        {reviewingOrder && (
          <div className={`${reviewDialogOpen ? 'block' : 'hidden'} fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4`}> 
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Leave a Review for {reviewingOrder.productName}</h3>
              <div className="mb-3">
                <label className="text-sm text-muted-foreground">Rating</label>
                <div className="flex items-center gap-2 mt-2">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setReviewRating(r)} className={`p-2 rounded ${r <= reviewRating ? 'bg-yellow-400 text-white' : 'bg-gray-200'}`}>
                      {r} ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground">Comment</label>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={4} className="w-full rounded border p-2 mt-1" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setReviewDialogOpen(false); setReviewingOrder(null); }}>Cancel</Button>
                <Button onClick={submitReview} disabled={isSubmittingReview}>{isSubmittingReview ? 'Submitting...' : 'Submit Review'}</Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BuyerDashboard;
