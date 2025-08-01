#!/bin/bash

echo "🚀 Starting AI Solana Mobile dApp - Phase 1 MVP Testing"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the ai-solana-mobile directory"
    exit 1
fi

echo "📋 Pre-flight checks:"
echo "✅ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Checking TypeScript..."
npm run type-check

echo ""
echo "🎯 Testing Instructions:"
echo "1. Make sure Phantom wallet is installed and set to Devnet"
echo "2. Get some devnet SOL from: https://faucet.solana.com/"
echo "3. Review the TESTING_CHECKLIST.md file"
echo ""
echo "📱 Starting Expo development server..."
echo "   - Press 'w' to open in web browser"
echo "   - Scan QR code with Expo Go app for mobile testing"
echo "   - Press 'q' to quit"
echo ""

# Note: The user said not to run pnpm run dev, so we'll just show instructions
echo "🔧 Ready to start! Run one of:"
echo "   npm start          # Start Expo development server"
echo "   npm run web        # Start web version"
echo "   npm run android    # Start Android version"
echo "   npm run ios        # Start iOS version"
echo ""
echo "📋 Follow the TESTING_CHECKLIST.md for complete testing guide"
