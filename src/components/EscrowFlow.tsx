import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/lib/api';
import { ExternalLink, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface EscrowFlowProps {
  orderId: string;
  txHash?: string;
  escrowId?: string;
  onClose?: () => void;
}

const EscrowFlow: React.FC<EscrowFlowProps> = ({ orderId, txHash, escrowId, onClose }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const prevEscrowStatus = { current: order?.escrowStatus ?? null } as { current: string | null };

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await apiService.getOrder(orderId);
        if (!mounted) return;
        // If escrow status changed, notify using a local ref instead of outer `order`
        if (data && prevEscrowStatus.current !== data.escrowStatus) {
          if (data.escrowStatus === 'released') {
            toast.success('Escrow released! Funds released to seller.');
          } else if (data.escrowStatus === 'locked') {
            toast.warning('Escrow locked for dispute.');
          }
        }
        prevEscrowStatus.current = data?.escrowStatus ?? null;
        setOrder(data);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        const message = (err as Error)?.message || 'Failed to load escrow status';
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Immediately fetch then poll every 5s until escrow released/refunded
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const openExplorer = () => {
    if (txHash) {
      window.open(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`, '_blank');
    }
  };

  const getStepStatus = () => {
    if (!order) return 'pending';
    if (order.escrowStatus === 'locked') return 'locked';
    if (order.escrowStatus === 'released') return 'released';
    return 'created';
  };

  const status = getStepStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-xl w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className={`h-5 w-5 ${status === 'created' ? 'animate-spin' : 'text-green-500'}`} />
                <CardTitle>Escrow & Payment</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {txHash && <Button variant="outline" size="sm" onClick={openExplorer}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Tx
                </Button>}
                <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div>Checking escrow status...</div>
              </div>
            )}

            {error && (
              <div className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            {!loading && order && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>Order ID</div>
                  <div className="font-mono">{order.orderId}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Escrow ID</div>
                  <div className="font-mono">{order.escrowId || escrowId || '—'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Escrow Status</div>
                  <div className={`${order.escrowStatus === 'released' ? 'text-green-600' : order.escrowStatus === 'locked' ? 'text-orange-600' : 'text-yellow-600'}`}>{order.escrowStatus || 'pending'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>Transaction</div>
                  <div className="font-mono">{txHash || order.transactionHash || '—'}</div>
                </div>

                {order.escrowStatus === 'released' && (
                  <div className="p-3 bg-green-50 rounded flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Funds have been released to the seller.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EscrowFlow;
