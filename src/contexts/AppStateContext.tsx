/* eslint-disable react-refresh/only-export-components */
import React, { useContext, ReactNode } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import type { AppState, AppActions, NftVerification, EscrowStatus } from '@/types/appState';
import { AppStateContext as AppStateContextValue } from './appStateValue';

interface ProviderValue {
  state: AppState;
  actions: AppActions;
}

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use the existing zustand store as backing store to avoid duplicated sources of truth
  const nftVerification = useAppStore((s) => s.nftVerification);
  const setNftVerification = useAppStore((s) => s.setNftVerification);

  const sellerTrust = useAppStore((s) => s.sellerTrust);
  const setSellerTrust = useAppStore((s) => s.setSellerTrust);

  const escrow = useAppStore((s) => s.escrow);
  const setEscrowStatus = useAppStore((s) => s.setEscrowStatus);

  const clearStore = useAppStore((s) => s.clearStore);

  const state: AppState = {
    nftVerification,
    sellerTrust,
    escrow,
  };

  const actions: AppActions = {
    setNftVerification: (serial: string, payload: NftVerification) => setNftVerification(serial, payload),
    setSellerTrust: (sellerId: string, score: number) => setSellerTrust(sellerId, score),
    setEscrowStatus: (escrowId: string, status: EscrowStatus, txHash?: string) => setEscrowStatus(escrowId, status, txHash),
    clearAppState: () => clearStore(),
  };

  return <AppStateContext.Provider value={{ state, actions }}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
};

export default AppStateContext;
