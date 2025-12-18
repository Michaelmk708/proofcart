export type EscrowStatus = 'pending' | 'locked' | 'released' | 'refunded' | 'unknown';

import type { NFTMetadata } from './index';

export interface NftVerification {
  verified: boolean;
  metadata?: NFTMetadata | null;
}

export interface AppState {
  // product serial -> verification
  nftVerification: Record<string, NftVerification | undefined>;
  // seller id -> trust score
  sellerTrust: Record<string, number | undefined>;
  // escrow id -> escrow status
  escrow: Record<string, { status: EscrowStatus; txHash?: string } | undefined>;
}

export interface AppActions {
  setNftVerification: (serial: string, payload: NftVerification) => void;
  setSellerTrust: (sellerId: string, score: number) => void;
  setEscrowStatus: (escrowId: string, status: EscrowStatus, txHash?: string) => void;
  clearAppState: () => void;
}
