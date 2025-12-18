import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAppState } from '@/contexts/AppStateContext';
import { apiService } from '@/lib/api';
import type { Order } from '@/types';
import type { NftVerification, EscrowStatus } from '@/types/appState';

const Notifications: React.FC = () => {
  const { state } = useAppState();
  // refs to keep track of previous values
  const prevNftRef = useRef<Record<string, NftVerification | undefined>>({});
  const prevEscrowRef = useRef<Record<string, { status: EscrowStatus; txHash?: string } | undefined>>({});
  const prevSellerRef = useRef<Record<string, number | undefined>>({});

  useEffect(() => {
    const prev = prevNftRef.current;
    const cur = state.nftVerification;
    // detect added or changed verifications
    for (const key of Object.keys(cur)) {
      const prevVal = prev[key];
      const curVal = cur[key];
      if (!prevVal && curVal) {
        // new entry
        toast.success(`Scanned: ${curVal.metadata?.name || key} — ${curVal.verified ? 'Verified' : 'Unverified'}`);
      } else if (prevVal?.verified !== curVal?.verified) {
        toast(`Verification update for ${curVal.metadata?.name || key}: ${curVal.verified ? 'Verified' : 'Not verified'}`);
      }
    }
    prevNftRef.current = cur;
  }, [state.nftVerification]);

  useEffect(() => {
    const prev = prevEscrowRef.current;
    const cur = state.escrow;
    for (const key of Object.keys(cur)) {
      const prevVal = prev[key];
      const curVal = cur[key];
      if (!prevVal && curVal) {
        toast(`Escrow ${key}: ${curVal.status}`);
      } else if (prevVal?.status !== curVal?.status) {
        if (curVal.status === 'released') toast.success(`Escrow ${key} released`);
        else if (curVal.status === 'locked') toast('Escrow locked — dispute opened');
        else if (curVal.status === 'refunded') toast.error(`Escrow ${key} refunded`);
        else toast(`Escrow ${key} updated: ${curVal.status}`);
      }
    }
    prevEscrowRef.current = cur;
  }, [state.escrow]);

  // Poll user orders (purchases and sales) to notify about shipment/payment updates
  useEffect(() => {
    let mounted = true;
    const prevPurchases: Record<string, Order> = {};
    const prevSales: Record<string, Order> = {};

    const fetchAndNotify = async () => {
      try {
        const [purchases, sales] = await Promise.all([apiService.getMyPurchases(), apiService.getMySales()]);
        if (!mounted) return;

        purchases.forEach((o) => {
          const prev = prevPurchases[o.id];
          if (!prev) {
            // new order
            toast(`Purchase ${o.id}: ${o.status}`);
          } else if (prev.status !== o.status) {
            if (o.status === 'shipped') toast.success(`Your order ${o.id} has been shipped`);
            else if (o.status === 'delivered') toast.success(`Your order ${o.id} was delivered`);
            else toast(`Order ${o.id} status: ${o.status}`);
          }
          prevPurchases[o.id] = o;
        });

        sales.forEach((o) => {
          const prev = prevSales[o.id];
          if (!prev) {
            toast(`Sale ${o.id}: ${o.status}`);
          } else if (prev.status !== o.status) {
            if (o.status === 'shipped') toast(`Sale ${o.id} shipped`);
            else if (o.status === 'delivered') toast.success(`Sale ${o.id} delivered`);
            else toast(`Sale ${o.id} status: ${o.status}`);
          }
          prevSales[o.id] = o;
        });
      } catch (e) {
        // ignore auth / network errors silently
      }
    };

    // initial fetch
    fetchAndNotify();
    const iv = setInterval(fetchAndNotify, 30000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  useEffect(() => {
    const prev = prevSellerRef.current;
    const cur = state.sellerTrust;
    for (const key of Object.keys(cur)) {
      const prevVal = prev[key];
      const curVal = cur[key];
      if (!prevVal && typeof curVal === 'number') {
        toast.success(`Seller ${key} trust score: ${curVal}`);
      } else if (prevVal !== curVal) {
        toast(`Seller ${key} trust score updated: ${curVal ?? 'N/A'}`);
      }
    }
    prevSellerRef.current = cur;
  }, [state.sellerTrust]);

  return null;
};

export default Notifications;
