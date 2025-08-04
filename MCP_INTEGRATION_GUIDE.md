# MCP Class-Based Architecture Integration Guide

## Overview
This guide shows how to integrate the new class-based MCP server architecture with real working functions extracted from combinedServer.ts.

## Architecture Summary
- **BaseMCPServer.ts**: Abstract base class with dynamic tool discovery
- **SolanaMCPServer.ts**: Wallet and blockchain operations (7 tools)
- **NodeMCPServer.ts**: Application node management (7 tools) using real functions
- **NodeService.ts**: Extracted real working functions from combinedServer.ts
- **mobileServerAdapter.ts**: Mobile-compatible client with initialization

## Integration Steps

### 1. Initialize the MCP Client in your component
```typescript
import { MobileMCPClient } from '../mcpServers/mobileServerAdapter';
import { useNodeContext } from '../contexts/NodeContext';
import { useWallet } from '../contexts/WalletContext';

const mcpClient = new MobileMCPClient();

// Initialize with node context functions
const nodeContext = useNodeContext();
await mcpClient.initialize({
  createPersonNode: nodeContext.createPersonNode,
  createEventNode: nodeContext.createEventNode,
  createCommunityNode: nodeContext.createCommunityNode,
  updatePersonNode: nodeContext.updatePersonNode,
  updateEventNode: nodeContext.updateEventNode,
  updateCommunityNode: nodeContext.updateCommunityNode,
  getNodes: nodeContext.getNodes,
  getNodeById: nodeContext.getNodeById,
  searchNodes: nodeContext.searchNodes,
  getLLMAccessibleNodes: nodeContext.getLLMAccessibleNodes
});

// Update wallet context when wallet connects
const { connection, publicKey, signTransaction } = useWallet();
mcpClient.updateWalletContext(connection, publicKey, signTransaction);
```

### 2. Get Available Tools
```typescript
const tools = await mcpClient.getTools();
console.log('Available MCP tools:', tools.map(t => t.name));
// Output: 14 tools total (7 Solana + 7 Node)
```

### 3. Execute Tools
```typescript
// Solana tools (require wallet connection)
const balance = await mcpClient.callTool('get_balance', {});
const airdrop = await mcpClient.callTool('request_airdrop', { amount: 1 });

// Node tools (work without wallet)
const nodes = await mcpClient.callTool('get_all_nodes', {});
const person = await mcpClient.callTool('create_person_node', {
  name: 'John Doe',
  bio: 'A developer',
  profileImageUrl: 'https://example.com/image.jpg',
  walletAddress: 'ABC123...',
  llmAccessible: true
});
```

## Available Tools

### Solana Tools (SolanaMCPServer)
1. `get_balance` - Get wallet SOL balance
2. `get_wallet_address` - Get current wallet address
3. `validate_address` - Validate a Solana address
4. `request_airdrop` - Request SOL airdrop (devnet/testnet)
5. `create_transaction` - Create a transaction
6. `get_recent_transactions` - Get transaction history
7. `check_transaction_status` - Check transaction confirmation

### Node Tools (NodeMCPServer)  
1. `list_accessible_nodes` - Get LLM-accessible nodes
2. `create_person_node` - Create a new person node
3. `get_all_nodes` - Get all application nodes
4. `search_nodes` - Search nodes with filters
5. `get_nodes_with_wallets` - Get nodes that have wallet addresses
6. `get_node_by_wallet` - Find node by wallet address
7. `get_node_details` - Get detailed node information

## Real Function Integration
All NodeMCPServer tools now use real working functions from combinedServer.ts via NodeService.ts:

- ✅ **getAllNodes()** - Returns actual node data
- ✅ **getLLMAccessibleNodes()** - Filters for LLM access
- ✅ **createPersonNode()** - Creates real person nodes
- ✅ **searchNodes()** - Performs actual node search
- ✅ **getNodeByWalletAddress()** - Real wallet lookup
- ✅ **getNodeById()** - Real node retrieval

## Key Benefits
1. **No Hardcoded Tools**: Dynamic tool discovery via `defineTools()`
2. **Real Functions**: All node operations use actual working functions
3. **Mobile Compatible**: Direct function calls, no web transport needed
4. **Type Safe**: Full TypeScript support with proper types
5. **Extensible**: Easy to add new servers and tools

## Testing
```typescript
// Test the complete system
const mcpClient = new MobileMCPClient();
await mcpClient.initialize(nodeContext);
mcpClient.updateWalletContext(connection, publicKey, signTransaction);

// Should return 14 tools
const tools = await mcpClient.getTools();
console.assert(tools.length === 14, 'Expected 14 tools');

// Test node functionality (no wallet required)
const nodes = await mcpClient.callTool('get_all_nodes', {});
console.log('Current nodes:', nodes);

// Test wallet functionality (requires wallet connection)
if (publicKey) {
  const balance = await mcpClient.callTool('get_balance', {});
  console.log('Wallet balance:', balance);
}
```

## Next Steps
1. Integrate MobileMCPClient into AI chat components
2. Test all tools end-to-end
3. Add error handling and validation
4. Consider adding more specialized servers (e.g., DeFi, NFT)
