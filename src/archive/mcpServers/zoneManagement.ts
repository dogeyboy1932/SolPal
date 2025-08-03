import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// React Flow types - commented out for React Native compatibility
// import type { Node } from 'reactflow';
type Node = any; // Placeholder for React Native
import {type ZONE_SERVERS_CONFIG, type ZoneData, getZoneData } from '../config/zone_config';

// Global variables to store React Flow state setters
let globalSetNodes: any = null;
let globalSetEdges: any = null;
// let globalNodes: Node[] = [];
let globalConnectedZones: string[] = [];

// Initialize the global state setters (call this from your React component)
export function initializeReactFlowFunctions(setNodes: any, setEdges: any, nodes: Node[], connectedZones: string[]) {
  globalSetNodes = setNodes;
  globalSetEdges = setEdges;
  // globalNodes = nodes;
  globalConnectedZones = connectedZones;
}


// Create a new zone node
export function createZoneSubmit(id: string, config: ZONE_SERVERS_CONFIG) {
  if (!globalSetNodes) {
    console.error('React Flow functions not initialized');
    return;
  }

  console.log('🏗️ Zone Management: Creating zone', id, config);

  const newNode: Node = {
    id,
    type: 'zoneBlock',
    position: config.position,
    data: {
      zoneId: id,
      label: config.label,
      connected: false,
    },
  };

  globalSetNodes((nodes: Node[]) => [...nodes, newNode]);

  // globalSetNodes((nodes: Node[]) => {
  //   const updated = [...nodes, newNode];
  //   globalNodes = updated;
  //   return updated;
  // });
}





// Update a zone node
export function updateZoneNode(nodeId: string, updates: any) {
  if (!globalSetNodes) {
    console.error('React Flow functions not initialized');
    return;
  }

  globalSetNodes((nodes: Node[]) => {
    const updated = nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    );
    // globalNodes = updated;
    return updated;
  });
}





// Delete a zone node
export function deleteZoneNode(nodeId: string) {
  if (!globalSetNodes || !globalSetEdges) {
    console.error('React Flow functions not initialized');
    return;
  }

  // Remove the node
  globalSetNodes((nodes: Node[]) => {
    const updated = nodes.filter(node => node.id !== nodeId);
    // globalNodes = updated;
    return updated;
  });

  // Remove connected edges
  globalSetEdges((edges: any[]) => 
    edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    )
  );
}





// Get all current nodes
export function getAllNodes(): Array<string> {
  return globalConnectedZones;
}

// Get a zone node
export function getZoneNode(nodeId: string): string | undefined {
  return globalConnectedZones.find(id => id === nodeId);
} 

























// ZONE MANAGEMENT MCP SERVER
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "zone-management-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Register zone management tools
  server.tool(
    'create_zone',
    {
      id: z.string().describe('Unique identifier for the zone (e.g., "weather-zone", "database-zone")'),
      label: z.string().describe('Display name for the zone (e.g., "Weather Services", "Database Cluster")'),
      position: z.object({
        x: z.number().describe('X coordinate for the zone position'),
        y: z.number().describe('Y coordinate for the zone position')
      }).describe('Position object with x and y coordinates for the zone placement'),
    },
    async ({ id, label, position }) => {
      console.log(`🏗️ Zone Management: Creating zone ${id}`);
      
      try {
        // Check if zone already exists
        const existingZone = getZoneNode(id);
        
        if (existingZone) {
          return {
            content: [{
              type: 'text',
              text: `❌ Zone with ID "${id}" already exists. Use update-zone to modify it or choose a different ID.`
            }]
          };
        }

        const config: ZONE_SERVERS_CONFIG = {
          label,
          position,
        };
          
        // Call the exported function to create the zone
        createZoneSubmit(id, config);

        return {
          content: [{
            type: 'text',
            text: `✅ Successfully created zone "${label}" with ID: ${id}\n📍 Position: (${position.x}, ${position.y})`
          }]
        };
      } catch (error) {
        console.error('Error creating zone:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create zone "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'update_zone',
    {
      id: z.string().describe('ID of the zone to update'),
      label: z.string().optional().describe('New label for the zone'),
      active: z.boolean().optional().describe('Active status of the zone (true/false)'),
      position: z.object({
        x: z.number().describe('X coordinate for the zone position'),
        y: z.number().describe('Y coordinate for the zone position')
      }).optional().describe('New position object with x and y coordinates for the zone')
    },
    async ({ id, label, active, position }) => {
      console.log(`🏗️ Zone Management: Updating zone ${id}`);
      
      try {
        // Check if zone exists
        const existingZone = getZoneNode(id);
        
        if (!existingZone) {
          return {
            content: [{
              type: 'text',
              text: `❌ Zone with ID "${id}" not found. Available zones: ${getAllNodes().join(', ') || 'None'}`
            }]
          };
        }

        // Prepare updates object
        const updates: any = {};
        if (label !== undefined) updates.label = label;
        if (active !== undefined) updates.active = active;

        // Call the exported function to update the zone
        updateZoneNode(id, updates);

        // Handle position update separately if needed (this would require updating the node position)
        if (position !== undefined) {
          globalSetNodes((nodes: Node[]) => {
            const updated = nodes.map(node => 
              node.id === id 
                ? { ...node, position: position }
                : node
            );
            // globalNodes = updated;
            return updated;
          });
        }

        const updatesList = [];
        if (label !== undefined) updatesList.push(`Label: ${label}`);
        if (active !== undefined) updatesList.push(`Active: ${active}`);
        if (position !== undefined) updatesList.push(`Position: (${position.x}, ${position.y})`);

        return {
          content: [{
            type: 'text',
            text: `✅ Successfully updated zone "${id}"\n📝 Updates: ${updatesList.join(', ')}`
          }]
        };
      } catch (error) {
        console.error('Error updating zone:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to update zone "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  server.tool(
    'delete_zone',
    {
      id: z.string().describe('ID of the zone to delete')
    },
    async ({ id }) => {
      console.log(`🏗️ Zone Management: Deleting zone ${id}`);
      
      try {
        // Check if zone exists
        const existingZone = getZoneNode(id);
        
        if (!existingZone) {
          return {
            content: [{
              type: 'text',
                text: `❌ Zone with ID "${id}" not found. Available zones: ${getAllNodes().join(', ') || 'None'}`
            }]
          };
        }

        // Call the exported function to delete the zone
        deleteZoneNode(id);

        return {
          content: [{
            type: 'text',
            text: `✅ Successfully deleted zone "${id}" (${existingZone})`
          }]
        };
      } catch (error) {
        console.error('Error deleting zone:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to delete zone "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // List all zones
  server.tool(
    'list_zones',
    {},
    async () => {
      console.log('🏗️ Zone Management: Listing all zones');
      
      try {
        const zones = getAllNodes();
        console.log('🏗️ Zone Management: Zones:', zones);
        
        if (zones.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '📝 No zones found. Use create-zone to create your first zone.'
            }]
          };
        }

        const zoneList = zones.map(zone => {
          const data = zone;
          return [
            `🏗️ ${data}`,
          ].join('\n');
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `📋 Found ${zones.length} zone(s):\n\n${zoneList}`
          }]
        };
      } catch (error) {
        console.error('Error listing zones:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to list zones: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );


  server.tool(
    'summarize_zones',
    'Summarizes the configuration, metrics, and status of a single zone based on its ID.',
    {
      id: z.string().describe('ID of the zone to summarize')
    },
    async ({ id }) => {
      console.log('🏗️ Zone Management: Summarizing single zone');
  
      try {
        const isConnected = getZoneNode(id);

        if (!isConnected) {
          console.log('🏗️ Zone Management: Zone not connected');
          return {
            content: [{
              type: 'text',
              text: '📝 Zone not connected. Use create-zone to create your first zone.'
            }]
          }; 
        }

        const zone: ZoneData | null = getZoneData(id);
        console.log('🏗️ Zone Management: Retrieved zone:', zone);
  
        if (!zone) {
          return {
            content: [{
              type: 'text',
              text: '📝 Zone not found. Use create-zone to create your first zone.'
            }]
          };
        }
  
        const summary = [
          `**Zone: ${zone.label}**`,
          `• Type: ${zone.zoneType}`,
          `• Status: ${zone.overview.status} (${zone.connected ? 'Connected' : 'Disconnected'})`,
          `• Region: ${zone.overview.region}`,
          `• Resources: ${zone.overview.resources}`,
          `• Uptime: ${zone.overview.uptime}`,
          `• Last Updated: ${zone.overview.lastUpdated}`,
          '',
          `📊 **Metrics:**`,
          `• CPU Usage: ${zone.metrics.cpuUsage}%`,
          `• Memory: ${zone.metrics.memoryUsed} / ${zone.metrics.memoryTotal}`,
          `• Requests/min: ${zone.metrics.requestsPerMin}`,
          `• Error Rate: ${zone.metrics.errorRate}`,
          `• Response Time: ${zone.metrics.responseTime}`,
          '',
          `⚙️ **Config:**`,
          `• Auto Scaling: ${zone.config.autoScaling}`,
          `• Max Instances: ${zone.config.maxInstances}`,
          `• Load Balancer: ${zone.config.loadBalancer}`,
          `• Timeout: ${zone.config.timeout}`,
          `• Health Checks: ${zone.config.healthChecks}`
        ].join('\n');
  
        return {
          content: [{
            type: 'text',
            text: summary
          }]
        };
      } catch (error) {
        console.error('Error summarizing zone:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to summarize zone: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );  

  return server;
}