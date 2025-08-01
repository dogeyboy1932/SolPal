# Phase 1 MVP Testing Checklist

## Prerequisites
- [ ] Phantom wallet installed on your device/browser
- [ ] Phantom wallet configured for Solana Devnet
- [ ] Some devnet SOL in your wallet (get from https://faucet.solana.com/)
- [ ] Optional: Some devnet SPL tokens for testing token transfers

## Testing Steps

### 1. App Launch & Setup
- [ ] App launches without errors
- [ ] UI components render correctly
- [ ] Toast notifications system works
- [ ] No TypeScript compilation errors

### 2. Wallet Connection Testing
- [ ] Click "Connect Wallet" button
- [ ] Phantom wallet opens and prompts for authorization
- [ ] Successfully authorize the app
- [ ] Wallet address displays correctly in UI
- [ ] Balance displays and updates correctly
- [ ] Connection status indicator shows "connected"

### 3. Account Switching (if multiple accounts)
- [ ] Account switcher appears if multiple accounts available
- [ ] Can switch between different accounts
- [ ] Balance updates when switching accounts
- [ ] Address changes correctly in UI

### 4. SOL Transfer Testing
- [ ] Enter a valid recipient address
- [ ] Enter a small amount (e.g., 0.001 SOL)
- [ ] Fee estimation appears
- [ ] Transaction submits successfully
- [ ] Toast notification shows success
- [ ] Balance updates after transaction
- [ ] Transaction appears in history

### 5. SPL Token Transfer Testing (if you have tokens)
- [ ] Token accounts load correctly
- [ ] Can select different tokens
- [ ] Can transfer tokens to another address
- [ ] Token balances update after transfer

### 6. Transaction History Testing
- [ ] Transaction history loads
- [ ] Recent transactions appear
- [ ] Can pull to refresh history
- [ ] Transaction details display correctly
- [ ] Transaction statuses show correctly

### 7. Wallet Testing Tools
- [ ] Devnet connection test passes
- [ ] Wallet function test passes
- [ ] Tests provide helpful feedback

### 8. Error Handling Testing
- [ ] Try invalid recipient address - shows error
- [ ] Try amount greater than balance - shows error
- [ ] Disconnect wallet - UI updates correctly
- [ ] Reconnect wallet - everything works again

### 9. UI/UX Testing
- [ ] All buttons respond to touch
- [ ] Scrolling works smoothly
- [ ] Text is readable and properly formatted
- [ ] Loading states show appropriately
- [ ] Error messages are clear and helpful

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
