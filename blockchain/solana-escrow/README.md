# ProofCart Solana Escrow Smart Contract

Anchor-based smart contract for secure escrow payments on Solana blockchain.

## Features

- **Create Escrow**: Initialize escrow account for orders
- **Confirm Delivery**: Release funds to seller upon buyer confirmation
- **Lock Dispute**: Lock funds when dispute is raised
- **Resolve Refund**: Admin can refund buyer for valid disputes
- **Resolve Release**: Admin can release to seller after dispute review

## Prerequisites

- Rust 1.75.0+
- Solana CLI 1.17+
- Anchor CLI 0.29.0+
- Node.js 18+ (for testing)

## Installation

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.75.0
rustup target add wasm32-unknown-unknown
```

### Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
```

### Install Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

## Build

```bash
cd blockchain/solana-escrow
anchor build
```

## Test

```bash
anchor test
```

## Deploy

### Deploy to Devnet

1. **Set Solana to Devnet**
```bash
solana config set --url devnet
```

2. **Create deployer keypair (if needed)**
```bash
solana-keygen new --outfile ~/.config/solana/devnet.json
```

3. **Airdrop SOL for deployment**
```bash
solana airdrop 2 --url devnet
```

4. **Deploy the program**
```bash
anchor deploy --provider.cluster devnet
```

5. **Note the Program ID**
The output will show your program ID. Update this in:
- `lib.rs` (declare_id! macro)
- Backend `.env` (SOLANA_PROGRAM_ID)
- Frontend `config.ts` (SOLANA_PROGRAM_ID)

### Deploy to Mainnet

1. **Set Solana to Mainnet**
```bash
solana config set --url mainnet-beta
```

2. **Ensure sufficient SOL for deployment**
```bash
solana balance
```

3. **Deploy**
```bash
anchor deploy --provider.cluster mainnet
```

## Program Instructions

### create_escrow
Creates a new escrow account for an order.

**Parameters:**
- `order_id`: String - Unique order identifier
- `amount`: u64 - Amount in lamports
- `bump`: u8 - PDA bump seed

**Accounts:**
- `escrow`: Escrow account (PDA)
- `buyer`: Signer
- `seller`: Recipient
- `escrow_account`: Account holding funds
- `system_program`: System program

### confirm_delivery
Releases escrowed funds to seller.

**Parameters:** None

**Accounts:**
- `escrow`: Escrow account
- `buyer`: Signer (must be original buyer)
- `seller`: Recipient
- `escrow_account`: Account holding funds
- `system_program`: System program

### lock_dispute
Locks escrow due to dispute.

**Parameters:** None

**Accounts:**
- `escrow`: Escrow account
- `buyer`: Signer

### resolve_refund
Admin resolves dispute by refunding buyer.

**Parameters:** None

**Accounts:**
- `escrow`: Escrow account
- `admin`: Signer (must be authorized admin)
- `buyer`: Recipient
- `escrow_account`: Account holding funds
- `system_program`: System program

### resolve_release
Admin resolves dispute by releasing to seller.

**Parameters:** None

**Accounts:**
- `escrow`: Escrow account
- `admin`: Signer (must be authorized admin)
- `seller`: Recipient
- `escrow_account`: Account holding funds
- `system_program`: System program

## Escrow Account Structure

```rust
pub struct Escrow {
    pub buyer: Pubkey,        // 32 bytes
    pub seller: Pubkey,       // 32 bytes
    pub order_id: String,     // 4 + 50 bytes
    pub amount: u64,          // 8 bytes
    pub status: EscrowStatus, // 1 byte
    pub bump: u8,             // 1 byte
    pub created_at: i64,      // 8 bytes
    pub locked_at: Option<i64>,    // 9 bytes
    pub released_at: Option<i64>,  // 9 bytes
    pub resolved_at: Option<i64>,  // 9 bytes
}
```

## Escrow Status

- `Created`: Escrow created, funds locked
- `Locked`: Dispute raised, awaiting admin resolution
- `Released`: Funds released to seller
- `Refunded`: Funds refunded to buyer

## Error Codes

- `UnauthorizedBuyer`: Only buyer can perform this action
- `InvalidEscrowStatus`: Invalid escrow status for operation
- `EscrowNotLocked`: Escrow must be locked for resolution
- `InsufficientFunds`: Not enough funds in escrow

## Integration Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ProofcartEscrow } from "../target/types/proofcart_escrow";

// Initialize
const provider = anchor.AnchorProvider.env();
const program = anchor.workspace.ProofcartEscrow as Program<ProofcartEscrow>;

// Create escrow
const orderId = "order_123";
const [escrowPda, bump] = await PublicKey.findProgramAddress(
  [Buffer.from("escrow"), Buffer.from(orderId)],
  program.programId
);

await program.methods
  .createEscrow(orderId, new anchor.BN(1000000000), bump)
  .accounts({
    escrow: escrowPda,
    buyer: buyer.publicKey,
    seller: seller.publicKey,
    escrowAccount: escrowPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([buyer])
  .rpc();

// Confirm delivery
await program.methods
  .confirmDelivery()
  .accounts({
    escrow: escrowPda,
    buyer: buyer.publicKey,
    seller: seller.publicKey,
    escrowAccount: escrowPda,
    systemProgram: SystemProgram.programId,
  })
  .signers([buyer])
  .rpc();
```

## Security Considerations

- Only buyer can confirm delivery
- Only admin can resolve disputes
- Escrow uses PDA for security
- All state transitions are validated
- Funds are held in program-derived address

## Upgrade Process

```bash
# Build new version
anchor build

# Deploy upgrade
anchor upgrade <PROGRAM_ID> target/deploy/proofcart_escrow.so
```

## Monitoring

Check escrow status:
```bash
solana account <ESCROW_PDA> --url devnet
```

View program logs:
```bash
solana logs <PROGRAM_ID> --url devnet
```

## Support

For issues or questions, contact: dev@proofcart.com
