#!/bin/bash

# ProofCart ICP NFT Canister Deployment Script
# This script deploys the NFT canister to Internet Computer

set -e

echo "🚀 Starting ICP NFT Canister Deployment..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX not found. Please install it first:"
    echo "   sh -c \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

cd "$(dirname "$0")"

# Ask user which network to deploy to
echo "Select deployment target:"
echo "1) Local (for testing)"
echo "2) IC Mainnet (production)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        NETWORK="local"
        echo "📝 Starting local IC replica..."
        dfx start --background --clean
        ;;
    2)
        NETWORK="ic"
        echo "📝 Deploying to IC mainnet..."
        echo "⚠️  Warning: This will consume ICP cycles"
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "Deployment cancelled"
            exit 0
        fi
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo "🔨 Deploying NFT canister..."
if [ "$NETWORK" = "local" ]; then
    CANISTER_ID=$(dfx deploy nft_canister 2>&1 | grep "Canister ID:" | awk '{print $3}')
else
    CANISTER_ID=$(dfx deploy --network ic nft_canister 2>&1 | grep "Canister ID:" | awk '{print $3}')
fi

if [ -z "$CANISTER_ID" ]; then
    echo "❌ Deployment failed or couldn't extract Canister ID"
    exit 1
fi

# Get the canister URL
if [ "$NETWORK" = "local" ]; then
    CANISTER_URL="http://$CANISTER_ID.localhost:8000"
    NETWORK_URL="http://localhost:8000"
else
    CANISTER_URL="https://$CANISTER_ID.ic0.app"
    NETWORK_URL="https://ic0.app"
fi

echo ""
echo "✅ Deployment successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Canister ID: $CANISTER_ID"
echo "Canister URL: $CANISTER_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Add this to your backend/.env file:"
echo "ICP_CANISTER_ID=$CANISTER_ID"
echo "ICP_NETWORK_URL=$NETWORK_URL"
echo ""

if [ "$NETWORK" = "local" ]; then
    echo "⚠️  Local replica is running in background"
    echo "   Stop it with: dfx stop"
fi

echo ""
echo "🎉 Done! Your NFT canister is live!"
