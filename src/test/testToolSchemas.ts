/**
 * TypeScript test to verify MCP tool schemas
 */

import { SolanaMCPServer } from '../mcpServers/SolanaMCP.js';
import { NodeMCPServer } from '../mcpServers/NodeMCP.js';
import { WeatherMCPServer } from '../mcpServers/WeatherMCP.js';
import type { MCPTool } from '../types/live-types.js';

// Test function to demonstrate tool schema generation
export function testToolSchemas() {
  console.log('🧪 Testing MCP Tool Schema Generation...\n');

  // Test Solana MCP Server
  console.log('📋 Testing SolanaMCPServer...');
  const solanaServer = new SolanaMCPServer();
  const solanaTools = solanaServer.getAvailableTools();
  
  console.log(`✅ SolanaMCP tools: ${solanaTools.length}`);
  
  // Find and display the get_node_details tool as example
  const nodeDetailsExample = solanaTools.find((t: MCPTool) => t.name === 'create_sol_transfer');
  if (nodeDetailsExample) {
    console.log('\n📝 Example - create_sol_transfer tool schema:');
    console.log(JSON.stringify(nodeDetailsExample, null, 2));
  }

  // Test Node MCP Server  
  console.log('\n📋 Testing NodeMCPServer...');
  const nodeServer = new NodeMCPServer();
  const nodeTools = nodeServer.getAvailableTools();
  
  console.log(`✅ NodeMCP tools: ${nodeTools.length}`);
  
  // Find and display the get_node_details tool as example
  const getNodeDetails = nodeTools.find((t: MCPTool) => t.name === 'get_node_details');
  if (getNodeDetails) {
    console.log('\n📝 Example - get_node_details tool schema:');
    console.log(JSON.stringify(getNodeDetails, null, 2));
  }

  // Test Weather MCP Server
  console.log('\n📋 Testing WeatherMCPServer...');
  const weatherServer = new WeatherMCPServer();
  const weatherTools = weatherServer.getAvailableTools();
  
  console.log(`✅ WeatherMCP tools: ${weatherTools.length}`);

  const weatherExample = weatherTools.find((t: MCPTool) => t.name === 'get_current_weather');
  if (weatherExample) {
    console.log('\n📝 Example - get_current_weather tool schema:');
    console.log(JSON.stringify(weatherExample, null, 2));
  }

  console.log('\n🎉 Tool schema testing completed!');
  
  return {
    solana: solanaTools,
    node: nodeTools, 
    weather: weatherTools
  };
}

// Export for use in React Native
export { testToolSchemas as default };
