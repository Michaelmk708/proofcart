import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apiService } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const resPurchases = await apiService.getMyPurchases();
      const resSales = await apiService.getMySales();
      setPurchases(resPurchases);
      setSales(resSales);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await apiService.confirmDelivery({ order_id: orderId, confirmed: true });
      toast.success('Delivery confirmed. Funds will be released shortly.');
      fetchOrders();
    } catch (err) {
      let msg = 'Failed to confirm delivery';
      if (typeof err === 'object' && err !== null) {
        const e = err as { response?: { data?: { error?: string } } };
        msg = e.response?.data?.error || msg;
      }
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Purchases</h2>
            {purchases.map((order) => (
              <Card key={order.order_id} className="mb-3">
                <CardHeader>
                  <CardTitle>{order.product_name || 'Order'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm">Amount: KES {order.total_amount}</p>
                      <p className="text-sm">Status: {order.status}</p>
                      <p className="text-sm">Escrow: {order.escrow_status || 'N/A'}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {order.status === 'IN_TRANSIT' && (
                        <Button onClick={() => handleConfirmDelivery(order.order_id)}>Confirm Delivery</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Sales</h2>
            {sales.map((order) => (
              <Card key={order.order_id} className="mb-3">
                <CardHeader>
                  <CardTitle>{order.product_name || 'Sale'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm">Amount: KES {order.total_amount}</p>
                      <p className="text-sm">Status: {order.status}</p>
                      <p className="text-sm">Escrow: {order.escrow_status || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Orders;
