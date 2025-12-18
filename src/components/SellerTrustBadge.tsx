import React, { useEffect } from 'react';
import { useAppState } from '@/contexts/AppStateContext';
import { apiService } from '@/lib/api';

interface SellerTrustBadgeProps {
  sellerId: string;
  size?: 'sm' | 'md' | 'lg';
}

const SellerTrustBadge: React.FC<SellerTrustBadgeProps> = ({ sellerId, size = 'md' }) => {
  const { state, actions } = useAppState();
  const trust = state.sellerTrust[sellerId];
  const setSellerTrust = actions.setSellerTrust;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await apiService.getSellerTrustScore(sellerId);
      if (!mounted) return;
      if (res) {
        setSellerTrust(sellerId, res.trust_score);
      }
    })();
    return () => { mounted = false; };
  }, [sellerId, setSellerTrust]);

  const getColor = () => {
    if (!trust) return 'bg-gray-200 text-gray-800';
    if (trust >= 80) return 'bg-green-100 text-green-800';
    if (trust >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const sizes = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-base px-4 py-1.5' };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${sizes[size]} ${getColor()}`}>
      <span className="font-semibold">Trust: {trust ?? 'N/A'}</span>
    </div>
  );
};

export default SellerTrustBadge;
