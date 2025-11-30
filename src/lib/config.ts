import { envConfig } from './envConfig';

// Application configuration
export const config = {
  api: {
    baseUrl: envConfig.apiBaseUrl + '/api',
    backendUrl: envConfig.apiBaseUrl,
  },
  solana: {
    network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
    rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    escrowProgramId: import.meta.env.VITE_ESCROW_PROGRAM_ID || 'HAYAMhivpCAegM7oepacQmr8TTbxKmpvjrxfuo3E2kNU',
  },
  icp: {
    canisterId: import.meta.env.VITE_ICP_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai',
    host: import.meta.env.VITE_ICP_HOST || 'http://127.0.0.1:4943',
  },
  ipfs: {
    gateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
    nftStorageApiKey: import.meta.env.VITE_NFT_STORAGE_API_KEY || '',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'ProofCart',
    tagline: import.meta.env.VITE_APP_TAGLINE || 'Trust Every Transaction',
  },
  env: envConfig,
} as const;
