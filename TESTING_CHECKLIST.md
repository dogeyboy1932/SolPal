# Phase 1 MVP Testing Checklist

## Prerequisites for Web Testing
- [ ] Phantom browser extension installed
- [ ] Phantom configured for Solana Devnet (Settings → Change Network → Devnet)
- [ ] Some devnet SOL in your wallet (get from https://faucet.solana.com/)
- [ ] Optional: Some devnet SPL tokens for testing token transfers

## Prerequisites for Mobile Testing  
- [ ] Phantom mobile app installed
- [ ] Phantom mobile app configured for Solana Devnet
- [ ] Some devnet SOL in your mobile wallet
- [ ] Expo Go app installed for testing

## Web Testing Steps (Start Here!)

### 1. Launch Web App
```bash
cd /home/dogeyboy19/Desktop/solana-mobile-hackathon/ai-solana-mobile
npm run web
```
- [ ] App launches without errors in browser
- [ ] UI components render correctly
- [ ] No console errors related to Buffer/crypto
- [ ] Toast notifications system works

### 2. Web Wallet Connection Testing
- [ ] Click "Connect Wallet" button
- [ ] Phantom browser extension popup appears
- [ ] Successfully authorize the app for Devnet
- [ ] Wallet address displays correctly in UI
- [ ] Balance displays and updates correctly
- [ ] Connection status indicator shows "connected"

### 3. Web SOL Transfer Testing
- [ ] Enter a valid recipient address (try another Phantom wallet)
- [ ] Enter a small amount (e.g., 0.001 SOL)
- [ ] Fee estimation appears
- [ ] Transaction submits successfully through Phantom popup
- [ ] Toast notification shows success
- [ ] Balance updates after transaction
- [ ] Transaction appears in history

### 4. Web SPL Token Transfer Testing (if you have tokens)
- [ ] Token accounts load correctly
- [ ] Can select different tokens
- [ ] Can transfer tokens to another address
- [ ] Token balances update after transfer

### 5. Web Transaction History Testing
- [ ] Transaction history loads
- [ ] Recent transactions appear
- [ ] Can pull to refresh history
- [ ] Transaction details display correctly
- [ ] Transaction statuses show correctly

### 6. Web Wallet Testing Tools
- [ ] Devnet connection test passes
- [ ] Wallet function test passes
- [ ] Tests provide helpful feedback

### 7. Web Error Handling Testing
- [ ] Try invalid recipient address - shows error
- [ ] Try amount greater than balance - shows error
- [ ] Disconnect wallet - UI updates correctly
- [ ] Reconnect wallet - everything works again

## Common Issues & Solutions

### Issue: "Cannot connect to wallet"
**Solution**: Make sure Phantom is configured for Devnet, not Mainnet

### Issue: "Insufficient funds"
**Solution**: Get devnet SOL from https://faucet.solana.com/

### Issue: "Transaction failed"
**Solution**: Try again - sometimes network congestion causes failures

### Issue: "No tokens found"
**Solution**: This is normal if you don't have SPL tokens on devnet

## Test Results
- [ ] All core functionality works
- [ ] Ready to proceed to Phase 2
- [ ] Issues found (document below):

### Issues Found:
_Write any issues you encounter here_

### Performance Notes:
_Note any performance issues or slow loading times_

## Next Steps
After successful testing:
1. Document any issues found
2. Confirm readiness for Phase 2 (Voice Commands & AI Integration)
3. Or request fixes for any critical issues found
