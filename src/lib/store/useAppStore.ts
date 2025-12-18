import create from 'zustand';
import type { NFTMetadata } from '@/types';

export type EscrowStatus = 'pending' | 'locked' | 'released' | 'refunded' | 'unknown';

interface AppStore {
  // product serial -> metadata/verified
  nftVerification: Record<string, { verified: boolean; metadata?: NFTMetadata | null } | undefined>;
  setNftVerification: (serial: string, payload: { verified: boolean; metadata?: NFTMetadata | null }) => void;

  // sellerId -> trust score
  sellerTrust: Record<string, number | undefined>;
  setSellerTrust: (sellerId: string, score: number) => void;

  // escrowId -> escrow status
  escrow: Record<string, { status: EscrowStatus; txHash?: string } | undefined>;
  setEscrowStatus: (escrowId: string, s: EscrowStatus, txHash?: string) => void;

  clearStore: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  nftVerification: {},
  setNftVerification: (serial, payload) => set((state) => ({ nftVerification: { ...state.nftVerification, [serial]: payload } })),

  sellerTrust: {},
  setSellerTrust: (sellerId, score) => set((state) => ({ sellerTrust: { ...state.sellerTrust, [sellerId]: score } })),

  escrow: {},
  setEscrowStatus: (escrowId, status, txHash) => set((state) => ({ escrow: { ...state.escrow, [escrowId]: { status, txHash } } })),

  clearStore: () => set({ nftVerification: {}, sellerTrust: {}, escrow: {} }),
}));
