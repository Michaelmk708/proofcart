# ProofCart NFT Canister - Internet Computer

ICP canister for minting and managing product NFTs with provenance tracking.

## Features

- **Mint NFT**: Create NFT for product with metadata
- **Verify Product**: Verify authenticity by serial number
- **Transfer Ownership**: Transfer NFT to new owner
- **Ownership History**: Track complete provenance chain
- **Revoke Verification**: Admin can revoke for counterfeits

## Prerequisites

- Rust 1.75.0+
- DFX SDK 0.15.0+
- IC CDK 0.13.0+

## Installation

### Install Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup default 1.75.0
rustup target add wasm32-unknown-unknown
```

### Install DFX
```bash
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
```

## Development

### Start Local Replica
```bash
cd blockchain/icp-nft
dfx start --background --clean
```

### Deploy Locally
```bash
dfx deploy
```

### Get Canister ID
```bash
dfx canister id proofcart_nft
```

## Build

```bash
dfx build
```

The WASM output will be in `.dfx/local/canisters/proofcart_nft/`

## Deploy

### Deploy to Local Network

1. **Start local replica**
```bash
dfx start --background
```

2. **Deploy canister**
```bash
dfx deploy proofcart_nft
```

3. **Note the Canister ID**
```bash
dfx canister id proofcart_nft
```

### Deploy to IC Mainnet

1. **Ensure you have cycles**
```bash
dfx wallet balance
```

2. **Create canister**
```bash
dfx canister create proofcart_nft --network ic
```

3. **Deploy**
```bash
dfx deploy proofcart_nft --network ic
```

4. **Get Canister ID**
```bash
dfx canister id proofcart_nft --network ic
```

Update the canister ID in:
- Backend `.env` (ICP_CANISTER_ID)
- Frontend `config.ts` (ICP_CANISTER_ID)

## Canister Methods

### mint_product_nft
Mint a new product NFT.

**Parameters:**
```rust
MintRequest {
    serial_number: String,
    product_name: String,
    manufacturer: String,
    manufacture_date: String,
    category: String,
    description: String,
    specifications: String,
    warranty_info: String,
    certifications: Vec<String>,
    ipfs_metadata_uri: String,
}
```

**Returns:** `Result<ProductNFT, String>`

**Example:**
```bash
dfx canister call proofcart_nft mint_product_nft '(
  record {
    serial_number = "SN123456";
    product_name = "Laptop";
    manufacturer = "TechCorp";
    manufacture_date = "2024-01-01";
    category = "Electronics";
    description = "High-performance laptop";
    specifications = "{ \"cpu\": \"Intel i7\", \"ram\": \"16GB\" }";
    warranty_info = "2 years";
    certifications = vec { "CE"; "FCC" };
    ipfs_metadata_uri = "ipfs://QmXxx...";
  }
)'
```

### verify_product
Verify product by serial number.

**Parameters:** `serial_number: String`

**Returns:** `Result<ProductNFT, String>`

**Example:**
```bash
dfx canister call proofcart_nft verify_product '("SN123456")'
```

### get_nft
Get NFT by ID.

**Parameters:** `nft_id: u64`

**Returns:** `Result<ProductNFT, String>`

**Example:**
```bash
dfx canister call proofcart_nft get_nft '(0)'
```

### transfer_nft
Transfer NFT to new owner.

**Parameters:**
- `nft_id: u64`
- `new_owner: Principal`

**Returns:** `Result<ProductNFT, String>`

**Example:**
```bash
dfx canister call proofcart_nft transfer_nft '(
  0,
  principal "aaaaa-aa"
)'
```

### get_nfts_by_owner
Get all NFTs owned by a principal.

**Parameters:** `owner: Principal`

**Returns:** `Vec<ProductNFT>`

**Example:**
```bash
dfx canister call proofcart_nft get_nfts_by_owner '(principal "xxxxx-xxxxx")'
```

### get_metadata
Get metadata by serial number.

**Parameters:** `serial_number: String`

**Returns:** `Result<NFTMetadata, String>`

### get_ownership_history
Get ownership history for NFT.

**Parameters:** `nft_id: u64`

**Returns:** `Result<Vec<OwnershipRecord>, String>`

### get_total_supply
Get total number of minted NFTs.

**Parameters:** None

**Returns:** `u64`

### revoke_verification (Admin Only)
Revoke NFT verification for counterfeit products.

**Parameters:** `nft_id: u64`

**Returns:** `Result<ProductNFT, String>`

## Data Structures

### ProductNFT
```rust
pub struct ProductNFT {
    pub nft_id: u64,
    pub serial_number: String,
    pub owner: Principal,
    pub metadata: NFTMetadata,
    pub minted_at: u64,
    pub verified: bool,
    pub ownership_history: Vec<OwnershipRecord>,
}
```

### NFTMetadata
```rust
pub struct NFTMetadata {
    pub serial_number: String,
    pub product_name: String,
    pub manufacturer: String,
    pub manufacture_date: String,
    pub category: String,
    pub description: String,
    pub specifications: String,
    pub warranty_info: String,
    pub certifications: Vec<String>,
    pub ipfs_metadata_uri: String,
}
```

### OwnershipRecord
```rust
pub struct OwnershipRecord {
    pub owner: Principal,
    pub timestamp: u64,
    pub transaction_type: String,
}
```

## Frontend Integration

### Using agent-js

```typescript
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "./declarations/proofcart_nft";

const agent = new HttpAgent({ host: "https://ic0.app" });
const canisterId = "your-canister-id";

const actor = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});

// Mint NFT
const result = await actor.mint_product_nft({
  serial_number: "SN123456",
  product_name: "Laptop",
  // ... other fields
});

// Verify product
const nft = await actor.verify_product("SN123456");
```

### Using Plug Wallet

```typescript
const publicKey = await window.ic.plug.requestConnect();

const result = await window.ic.plug.agent.call(
  canisterId,
  "mint_product_nft",
  [mintRequest]
);
```

## Testing

### Unit Tests
```bash
cargo test
```

### Integration Tests
```bash
dfx start --background
dfx deploy
# Run your test scripts
dfx stop
```

## Upgrade Canister

```bash
# Build new version
dfx build proofcart_nft

# Upgrade
dfx canister install proofcart_nft --mode upgrade
```

## Monitoring

### Check Canister Status
```bash
dfx canister status proofcart_nft
```

### View Canister Logs
```bash
dfx canister logs proofcart_nft
```

### Check Cycles Balance
```bash
dfx canister status proofcart_nft --network ic
```

## Cycles Management

Top up canister with cycles:
```bash
dfx canister deposit-cycles <amount> proofcart_nft --network ic
```

## Security Considerations

- Only canister admin can revoke verification
- Serial numbers are unique (enforced)
- Ownership transfers require current owner signature
- Immutable ownership history
- Stable storage for persistence across upgrades

## Candid Interface

The Candid interface is auto-generated in `.dfx/local/canisters/proofcart_nft/proofcart_nft.did`

View it:
```bash
cat .dfx/local/canisters/proofcart_nft/proofcart_nft.did
```

## Troubleshooting

### Out of Cycles
Top up canister cycles via NNS dapp or dfx wallet.

### Build Errors
Ensure Rust toolchain is 1.75.0 and wasm32 target is installed.

### Deployment Fails
Check network connectivity and wallet balance.

## Support

For issues or questions, contact: dev@proofcart.com
