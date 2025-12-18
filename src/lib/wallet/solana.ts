import { Connection, PublicKey } from '@solana/web3.js';
import { config } from '../config';

// Helper to query on-chain accounts or metadata for NFT verification
export async function verifyNFTOnChain(mintAddress: string) {
  try {
    const conn = new Connection(config.solana.rpcUrl, 'confirmed');
    const pub = new PublicKey(mintAddress);
    // Try fetch token supply and metadata via metadata program (metaplex)
    // For now, basic check: confirm account exists and get some info
    const info = await conn.getAccountInfo(pub);
    if (!info) return { exists: false };

    return { exists: true, dataLength: info.data.length };
  } catch (error) {
    console.error('On-chain verification failed', error);
    return { exists: false, error };
  }
}
