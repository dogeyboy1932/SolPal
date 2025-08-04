#!/usr/bin/env node

/**
 * Test script to verify MCP tool schemas are properly formatted
 */

// Mock imports for testing
const mockConnection = null;
const mockPublicKey = null;

// Import the MCP servers
const { SolanaMCPServer } = require('./src/mcpServers/SolanaMCP.ts');
const { NodeMCPServer } = require('./src/mcpServers/NodeMCP.ts');
const { WeatherMCPServer } = require('./src/mcpServers/WeatherMCP.ts');

async function testToolSchemas() {
  console.log('🧪 Testing MCP Tool Schema Generation...\n');

  try {
    // Test Solana MCP Server
    console.log('📋 Testing SolanaMCPServer...');
    const solanaServer = new SolanaMCPServer();
    solanaServer.initialize(mockConnection, mockPublicKey);
    const solanaTools = solanaServer.getAvailableTools();
    
    console.log(`✅ SolanaMCP tools: ${solanaTools.length}`);
    solanaTools.forEach(tool => {
      console.log(`  - ${tool.name}:`);
      console.log(`    Properties: ${Object.keys(tool.parameters.properties || {}).length}`);
      console.log(`    Required: ${(tool.parameters.required || []).length}`);
      console.log(`    Schema:`, JSON.stringify(tool.parameters, null, 2));
    });

    // Test Node MCP Server
    console.log('\n📋 Testing NodeMCPServer...');
    const nodeServer = new NodeMCPServer();
    const nodeTools = nodeServer.getAvailableTools();
    
    console.log(`✅ NodeMCP tools: ${nodeTools.length}`);
    nodeTools.forEach(tool => {
      console.log(`  - ${tool.name}:`);
      console.log(`    Properties: ${Object.keys(tool.parameters.properties || {}).length}`);
      console.log(`    Required: ${(tool.parameters.required || []).length}`);
      if (tool.name === 'get_node_details') {
        console.log(`    Example Schema:`, JSON.stringify(tool.parameters, null, 2));
      }
    });

    // Test Weather MCP Server
    console.log('\n📋 Testing WeatherMCPServer...');
    const weatherServer = new WeatherMCPServer();
    const weatherTools = weatherServer.getAvailableTools();
    
    console.log(`✅ WeatherMCP tools: ${weatherTools.length}`);
    weatherTools.forEach(tool => {
      console.log(`  - ${tool.name}:`);
      console.log(`    Properties: ${Object.keys(tool.parameters.properties || {}).length}`);
      console.log(`    Required: ${(tool.parameters.required || []).length}`);
    });

    console.log('\n🎉 Tool schema testing completed!');
    
  } catch (error) {
    console.error('❌ Tool schema test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testToolSchemas();
