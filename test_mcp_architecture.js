/**
 * Test script to verify the new dynamic MCP server architecture
 */

import { WeatherMCPServer } from '../src/mcpServers/WeatherMCP';
import { NodeMCPServer } from '../src/mcpServers/NodeMCP';
import { SolanaMCPServer } from '../src/mcpServers/SolanaMCP';

// Test the new dynamic registration
console.log('🧪 Testing Dynamic MCP Server Architecture...\n');

// Test Weather Server
const weatherServer = new WeatherMCPServer();
console.log('🌤️ Weather Server:');
console.log(`  - Name: ${weatherServer.serverName}`);
console.log(`  - Tools: ${weatherServer.getToolNames().join(', ')}`);
console.log(`  - Tool Count: ${weatherServer.getAvailableTools().length}`);

// Test Node Server  
const nodeServer = new NodeMCPServer();
console.log('\n🔗 Node Server:');
console.log(`  - Name: ${nodeServer.serverName}`);
console.log(`  - Tools: ${nodeServer.getToolNames().join(', ')}`);
console.log(`  - Tool Count: ${nodeServer.getAvailableTools().length}`);

// Test Solana Server
const solanaServer = new SolanaMCPServer();
console.log('\n₿ Solana Server:');
console.log(`  - Name: ${solanaServer.serverName}`);
console.log(`  - Tools: ${solanaServer.getToolNames().join(', ')}`);
console.log(`  - Tool Count: ${solanaServer.getAvailableTools().length}`);

// Test tool schema format
console.log('\n📋 Sample Tool Schema (Weather):');
const weatherTools = weatherServer.getAvailableTools();
if (weatherTools.length > 0) {
  console.log(JSON.stringify(weatherTools[0], null, 2));
}

console.log('\n✅ Dynamic MCP Server Architecture Test Complete!');
