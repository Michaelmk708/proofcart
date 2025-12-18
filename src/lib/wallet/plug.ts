import { config } from '../config';
import type { NFTMetadata } from '@/types';

declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect?: (opts: { whitelist: string[]; host?: string }) => Promise<void>;
        isConnected?: () => boolean;
        agent?: {
          getPrincipal?: () => Promise<{ toString(): string }>;
          update?: (canisterId: string, opts: { methodName?: string; args?: unknown }) => Promise<unknown>;
        };
      };
    };
  }
}

export class PlugWalletService {
  private canisterId: string;

  constructor() {
    this.canisterId = config.icp.canisterId;
  }

  // Check if Plug wallet is installed
  isPlugInstalled(): boolean {
    return typeof window !== 'undefined' && window.ic?.plug;
  }

  // Connect to Plug wallet
  async connect(): Promise<string> {
    if (!this.isPlugInstalled()) {
      throw new Error('Plug wallet is not installed. Please install it from https://plugwallet.ooo/');
    }

    try {
      const whitelist = [this.canisterId];
      const host = config.icp.host;

      await window.ic.plug.requestConnect({ whitelist, host });
      
      if (window.ic.plug.isConnected()) {
        const principalId = await window.ic.plug.agent.getPrincipal();
        return principalId.toString();
      }
      
      throw new Error('Failed to connect to Plug wallet');
    } catch (error) {
      console.error('Error connecting to Plug:', error);
      throw new Error('Failed to connect to Plug wallet');
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    if (window.ic?.plug) {
      await window.ic.plug.disconnect();
    }
  }

  // Check if connected
  isConnected(): boolean {
    return window.ic?.plug?.isConnected() || false;
  }

  // Get principal ID
  async getPrincipalId(): Promise<string | null> {
    if (this.isConnected()) {
      const principal = await window.ic.plug.agent.getPrincipal();
      return principal.toString();
    }
    return null;
  }

  // Mint NFT for product
  async mintProductNFT(
    serialNumber: string,
    manufacturer: string,
    metadataUri: string,
    productName: string,
    productId: number
  ): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Plug wallet not connected');
    }

    try {
      const principalId = await this.getPrincipalId();
      
      // Call backend to prepare mint data
      const response = await fetch(`${config.api.backendUrl}/api/nft/mint/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          serial_number: serialNumber,
          manufacturer: manufacturer,
          metadata_uri: metadataUri,
          product_name: productName,
          product_id: productId,
          owner_principal: principalId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to prepare mint transaction');
      }

      const resJson = await response.json() as { canister_id?: string; method?: string; args?: unknown };
      const { canister_id, method, args } = resJson;

      // Call the canister via Plug wallet
      // Call the plug agent
      const agent = window.ic!.plug!.agent!;
      const result = await agent.update!(canister_id!, {
        methodName: method,
        args: args,
      });

      // result should contain the NFT ID
      return result.toString();
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw new Error('Failed to mint product NFT');
    }
  }

  // Verify product NFT
  async verifyProductNFT(serialNumber: string): Promise<NFTMetadata | null> {
    try {
      // Call backend to verify via canister query
      const response = await fetch(`${config.api.backendUrl}/api/nft/verify/${serialNumber}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.exists && data.nft_data) {
        return {
          id: data.nft_data.id,
          serialNumber: data.nft_data.serial_number,
          productName: data.nft_data.product_name,
          manufacturer: data.nft_data.manufacturer,
          mintDate: new Date(Number(data.nft_data.minted_at) / 1000000).toISOString().split('T')[0],
          metadataUri: data.nft_data.metadata_uri,
          verified: true
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error verifying NFT:', error);
      return null;
    }
  }

  // Transfer NFT ownership
  async transferNFT(nftId: string, newOwner: string): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('Plug wallet not connected');
    }

    try {
      // In a real implementation, this would call your ICP canister's transfer_nft function
      console.log('Transferring NFT:', nftId, 'to', newOwner);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } catch (error) {
      console.error('Error transferring NFT:', error);
      return false;
    }
  }

  // Get NFT metadata
  async getNFTMetadata(nftId: string): Promise<NFTMetadata | null> {
    try {
      // In a real implementation, this would query your ICP canister
      console.log('Fetching NFT metadata:', nftId);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return {
        id: nftId,
        serialNumber: `SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        productName: 'Premium Product',
        manufacturer: 'Trusted Manufacturer',
        mintDate: new Date().toISOString().split('T')[0],
        metadataUri: `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substring(2)}`,
        verified: true,
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }
}

export const plugWallet = new PlugWalletService();
