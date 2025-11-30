# ProofCart Blockchain Infrastructure

This directory contains the smart contracts for ProofCart's blockchain infrastructure.

## Overview

ProofCart uses a dual-blockchain architecture:

1. **Solana** - Escrow payments and transaction settlement
2. **Internet Computer Protocol (ICP)** - NFT minting and product verification

## Directory Structure

```
blockchain/
├── solana-escrow/     # Solana Anchor program for escrow
│   ├── src/
│   │   └── lib.rs     # Escrow smart contract
│   ├── Cargo.toml
│   ├── rust-toolchain.toml
│   └── README.md
│
└── icp-nft/          # ICP canister for NFT management
    ├── src/
    │   └── lib.rs     # NFT canister
    ├── Cargo.toml
    ├── dfx.json
    └── README.md
```

## Quick Start

### Solana Escrow

```bash
cd solana-escrow
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

See [solana-escrow/README.md](./solana-escrow/README.md) for details.

### ICP NFT Canister

```bash
cd icp-nft
dfx start --background
dfx deploy
```

See [icp-nft/README.md](./icp-nft/README.md) for details.

## Architecture

### Payment Flow (Solana)

1. Buyer places order
2. Frontend creates escrow transaction
3. Funds locked in program-derived address (PDA)
4. Seller ships product
5. Buyer confirms delivery
6. Escrow releases funds to seller

### Dispute Resolution (Solana)

1. Buyer raises dispute
2. Escrow status → Locked
3. Admin reviews evidence
4. Admin resolves: Refund buyer OR Release to seller

### Product Verification (ICP)

1. Seller creates product listing
2. Seller mints NFT with serial number
3. NFT stored on ICP with metadata
4. Buyer can verify authenticity by serial number
5. NFT transfers with product ownership

## Network Configuration

### Development

- **Solana**: Devnet (https://api.devnet.solana.com)
- **ICP**: Local replica (dfx start)

### Production

- **Solana**: Mainnet Beta (https://api.mainnet-beta.solana.com)
- **ICP**: IC Mainnet (https://ic0.app)

## Deployment Checklist

### Solana Escrow

- [ ] Build contract: `anchor build`
- [ ] Test contract: `anchor test`
- [ ] Deploy to devnet: `anchor deploy --provider.cluster devnet`
- [ ] Note program ID
- [ ] Update backend `.env` with `SOLANA_PROGRAM_ID`
- [ ] Update frontend `config.ts` with program ID
- [ ] Test integration with frontend/backend
- [ ] Deploy to mainnet: `anchor deploy --provider.cluster mainnet`

### ICP NFT Canister

- [ ] Build canister: `dfx build`
- [ ] Deploy locally: `dfx deploy`
- [ ] Test canister methods
- [ ] Deploy to mainnet: `dfx deploy --network ic`
- [ ] Note canister ID
- [ ] Update backend `.env` with `ICP_CANISTER_ID`
- [ ] Update frontend `config.ts` with canister ID
- [ ] Top up cycles for production
- [ ] Test integration

## Integration with Backend

The Django backend integrates with blockchains via service layers:

- `backend/apps/orders/services/solana_service.py` - Solana integration
- `backend/apps/nft/services/icp_service.py` - ICP integration

These services abstract blockchain interactions for the REST API.

## Integration with Frontend

The React frontend uses wallet-specific libraries:

- `src/lib/wallet/phantom.ts` - Solana/Phantom wallet
- `src/lib/wallet/plug.ts` - ICP/Plug wallet

## Security Considerations

### Solana
- Use PDA for escrow accounts (no private keys)
- Validate signer authority on all instructions
- Check account ownership before transfers
- Implement proper error handling

### ICP
- Use stable structures for persistence
- Validate caller identity
- Implement access control for admin functions
- Monitor cycles balance

## Cost Estimates

### Solana (Devnet/Mainnet)
- Deploy program: ~3-5 SOL
- Create escrow: ~0.002 SOL
- Transaction fees: ~0.000005 SOL

### ICP (Mainnet)
- Create canister: ~1T cycles
- Store NFT: ~0.1B cycles per NFT
- Query calls: Free
- Update calls: ~0.01B cycles

## Monitoring

### Solana
```bash
# Check program
solana program show <PROGRAM_ID> --url devnet

# Monitor logs
solana logs <PROGRAM_ID> --url devnet
```

### ICP
```bash
# Check canister status
dfx canister status proofcart_nft --network ic

# View logs
dfx canister logs proofcart_nft --network ic
```

## Testing

### Solana
```bash
cd solana-escrow
anchor test
```

### ICP
```bash
cd icp-nft
cargo test
```

## Upgrading Contracts

### Solana
```bash
anchor upgrade <PROGRAM_ID> target/deploy/proofcart_escrow.so
```

### ICP
```bash
dfx canister install proofcart_nft --mode upgrade --network ic
```

## Support

For blockchain-specific issues:
- Solana: Check Anchor Discord
- ICP: Check DFINITY Forum

For ProofCart integration issues: dev@proofcart.com

## License

MIT License - See LICENSE file for details
