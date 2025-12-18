import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { config } from '../config';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect?: () => Promise<{ publicKey: { toString(): string } }>;
      disconnect?: () => Promise<void>;
      isConnected?: boolean;
      publicKey?: { toString(): string };
      signTransaction?: (tx: Transaction) => Promise<Transaction>;
      signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
    };
  }
}

export class PhantomWalletService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
  }

  // Check if Phantom is installed
  isPhantomInstalled(): boolean {
    return typeof window !== 'undefined' && window.solana?.isPhantom;
  }

  // Connect to Phantom wallet
  async connect(): Promise<string> {
    if (!this.isPhantomInstalled()) {
      throw new Error('Phantom wallet is not installed. Please install it from https://phantom.app/');
    }

    try {
      const response = await window.solana.connect();
      return response.publicKey.toString();
    } catch (error) {
      throw new Error('Failed to connect to Phantom wallet');
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    if (window.solana) {
      await window.solana.disconnect();
    }
  }

  // Get connected wallet address
  getWalletAddress(): string | null {
    if (window.solana?.isConnected) {
      return window.solana.publicKey.toString();
    }
    return null;
  }

  // Get wallet balance
  async getBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Create escrow transaction
  async createEscrowTransaction(
    sellerAddress: string,
    amount: number,
    orderId: string
  ): Promise<string> {
    if (!window.solana?.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const buyerPublicKey = window.solana.publicKey;

      // Call backend to get escrow instruction data
      const response = await fetch(`${config.api.backendUrl}/api/orders/${orderId}/escrow/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          buyer_pubkey: buyerPublicKey.toString(),
          seller_pubkey: sellerAddress,
          amount: amount,
          order_id: orderId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to prepare escrow transaction');
      }

      const json = await response.json() as { program_id?: string; escrow_id?: string; instruction_data?: string };
      const { program_id, escrow_id, instruction_data } = json;

      // Build transaction with instruction from backend
      const transaction = new Transaction();
      
      // Decode instruction data from base58
      const instructionBuffer = Buffer.from(instruction_data, 'base64');
      
      // Add the escrow instruction
      transaction.add({
        keys: [
          { pubkey: new PublicKey(escrow_id), isSigner: false, isWritable: true },
          { pubkey: buyerPublicKey, isSigner: true, isWritable: true },
          { pubkey: new PublicKey(sellerAddress), isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: new PublicKey(program_id),
        data: instructionBuffer
      });

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyerPublicKey;

      // Sign and send transaction
      const signed = await window.solana.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(signature);
      
      return signature;
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      throw new Error('Failed to create escrow transaction');
    }
  }

  // Confirm delivery and release escrow
  async releaseEscrow(escrowId: string, orderId: string): Promise<string> {
    if (!window.solana?.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const buyerPublicKey = window.solana.publicKey;

      // Call backend to get release instruction data
      const response = await fetch(`${config.api.backendUrl}/api/orders/${orderId}/escrow/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          escrow_id: escrowId,
          buyer_pubkey: buyerPublicKey.toString(),
          order_id: orderId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to prepare release transaction');
      }

      const json2 = await response.json() as { program_id?: string; instruction_data?: string };
      const { program_id, instruction_data } = json2;

      // Build transaction
      const transaction = new Transaction();
      const instructionBuffer = Buffer.from(instruction_data, 'base64');
      
      transaction.add({
        keys: [
          { pubkey: new PublicKey(escrowId), isSigner: false, isWritable: true },
          { pubkey: buyerPublicKey, isSigner: true, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: new PublicKey(program_id),
        data: instructionBuffer
      });

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyerPublicKey;

      // Sign and send
      const signed = await window.solana.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(signature);
      
      return signature;
    } catch (error) {
      console.error('Error releasing escrow:', error);
      throw new Error('Failed to release escrow');
    }
  }

  // Lock escrow for dispute
  async lockEscrow(escrowId: string, orderId: string, reason: string): Promise<string> {
    if (!window.solana?.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const adminPublicKey = window.solana.publicKey;

      // Call backend to get dispute instruction data
      const response = await fetch(`${config.api.backendUrl}/api/orders/${orderId}/escrow/dispute/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          escrow_id: escrowId,
          admin_pubkey: adminPublicKey.toString(),
          reason: reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to prepare dispute transaction');
      }

      const json3 = await response.json() as { program_id?: string; instruction_data?: string };
      const { program_id, instruction_data } = json3;

      // Build transaction
      const transaction = new Transaction();
      const instructionBuffer = Buffer.from(instruction_data, 'base64');
      
      transaction.add({
        keys: [
          { pubkey: new PublicKey(escrowId), isSigner: false, isWritable: true },
          { pubkey: adminPublicKey, isSigner: true, isWritable: false },
        ],
        programId: new PublicKey(program_id),
        data: instructionBuffer
      });

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = adminPublicKey;

      // Sign and send
      const signed = await window.solana.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signed.serialize());
      
      await this.connection.confirmTransaction(signature);
      
      return signature;
    } catch (error) {
      console.error('Error locking escrow:', error);
      throw new Error('Failed to lock escrow');
    }
  }

  // Get transaction details
  async getTransactionDetails(signature: string): Promise<Record<string, unknown> | null> {
    try {
      const transaction = await this.connection.getTransaction(signature);
      return transaction as Record<string, unknown> | null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }
}

export const phantomWallet = new PhantomWalletService();
