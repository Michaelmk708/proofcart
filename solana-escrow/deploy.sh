#!/bin/bash

# ProofCart Solana Escrow Deployment Script
# This script deploys the escrow program to Solana devnet

set -e

echo "🚀 Starting Solana Escrow Program Deployment..."

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install latest && avm use latest"
    exit 1
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

cd "$(dirname "$0")"

echo "📝 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com

echo "💰 Requesting airdrop (if needed)..."
solana airdrop 2 || echo "Airdrop failed or balance sufficient"

echo "🔨 Building Anchor program..."
anchor build

echo "🚀 Deploying to Solana devnet..."
PROGRAM_ID=$(anchor deploy --provider.cluster devnet 2>&1 | grep "Program Id:" | awk '{print $3}')

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ Deployment failed or couldn't extract Program ID"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Program ID: $PROGRAM_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Add this to your backend/.env file:"
echo "SOLANA_PROGRAM_ID=$PROGRAM_ID"
echo "SOLANA_RPC_URL=https://api.devnet.solana.com"
echo "SOLANA_NETWORK=devnet"
echo ""
echo "🎉 Done! Your escrow program is live on Solana devnet!"
