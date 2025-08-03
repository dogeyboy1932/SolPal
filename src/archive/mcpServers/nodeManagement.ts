// import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// import { z } from 'zod';
// import type { 
//   Node, 
//   PersonNode, 
//   EventNode, 
//   CommunityNode, 
//   NodeType,
//   NodeFilters,
//   CreatePersonNodeData,
//   CreateEventNodeData,
//   CreateCommunityNodeData,
//   UpdatePersonNodeData,
//   UpdateEventNodeData,
//   UpdateCommunityNodeData
// } from '../types/nodes';

// // Global variables to store Node context state setters and getters
// let globalCreatePersonNode: ((node: CreatePersonNodeData) => Promise<PersonNode>) | null = null;
// let globalCreateEventNode: ((node: CreateEventNodeData) => Promise<EventNode>) | null = null;
// let globalCreateCommunityNode: ((node: CreateCommunityNodeData) => Promise<CommunityNode>) | null = null;
// let globalUpdatePersonNode: ((id: string, updates: UpdatePersonNodeData) => Promise<void>) | null = null;
// let globalUpdateEventNode: ((id: string, updates: UpdateEventNodeData) => Promise<void>) | null = null;
// let globalUpdateCommunityNode: ((id: string, updates: UpdateCommunityNodeData) => Promise<void>) | null = null;
// let globalGetNodes: (() => Node[]) | null = null;
// let globalGetNodeById: ((id: string) => Node | undefined) | null = null;
// let globalSearchNodes: ((filters: NodeFilters) => Node[]) | null = null;

// // Initialize the global node management functions (call this from NodeContext)
// export function initializeNodeManagementFunctions(
//   createPersonNode: (node: CreatePersonNodeData) => Promise<PersonNode>,
//   createEventNode: (node: CreateEventNodeData) => Promise<EventNode>,
//   createCommunityNode: (node: CreateCommunityNodeData) => Promise<CommunityNode>,
//   updatePersonNode: (id: string, updates: UpdatePersonNodeData) => Promise<void>,
//   updateEventNode: (id: string, updates: UpdateEventNodeData) => Promise<void>,
//   updateCommunityNode: (id: string, updates: UpdateCommunityNodeData) => Promise<void>,
//   getNodes: () => Node[],
//   getNodeById: (id: string) => Node | undefined,
//   searchNodes: (filters: NodeFilters) => Node[]
// ) {
//   globalCreatePersonNode = createPersonNode;
//   globalCreateEventNode = createEventNode;
//   globalCreateCommunityNode = createCommunityNode;
//   globalUpdatePersonNode = updatePersonNode;
//   globalUpdateEventNode = updateEventNode;
//   globalUpdateCommunityNode = updateCommunityNode;
//   globalGetNodes = getNodes;
//   globalGetNodeById = getNodeById;
//   globalSearchNodes = searchNodes;
// }

// // Helper functions to access nodes
// export function getAllNodes(): Node[] {
//   if (!globalGetNodes) {
//     console.error('Node management functions not initialized');
//     return [];
//   }
//   return globalGetNodes();
// }

// export function getNodeById(id: string): Node | undefined {
//   if (!globalGetNodeById) {
//     console.error('Node management functions not initialized');
//     return undefined;
//   }
//   return globalGetNodeById(id);
// }

// export function searchNodes(query: string): Node[] {
//   if (!globalSearchNodes) {
//     console.error('Node management functions not initialized');
//     return [];
//   }
//   return globalSearchNodes({ searchTerm: query });
// }

// // Find nodes by wallet address
// export function getNodeByWalletAddress(address: string): Node | undefined {
//   const nodes = getAllNodes();
//   return nodes.find(node => {
//     if (node.type === 'person') {
//       return (node as PersonNode).walletAddress === address;
//     }
//     return false;
//   });
// }

// // Find nodes by name (fuzzy match)
// export function getNodeByName(name: string): Node | undefined {
//   const nodes = getAllNodes();
//   const nameLower = name.toLowerCase();
//   return nodes.find(node => node.name.toLowerCase().includes(nameLower));
// }

// // Get nodes with wallet addresses (for transaction targets)
// export function getNodesWithWallets(): Node[] {
//   const nodes = getAllNodes();
//   return nodes.filter(node => {
//     if (node.type === 'person') {
//       return !!(node as PersonNode).walletAddress;
//     }
//     return false;
//   });
// }

// // NODE MANAGEMENT MCP SERVER
// export function createMcpServer(): McpServer {
//   const server = new McpServer({
//     name: "node-management-mcp",
//     version: "1.0.0",
//     capabilities: {
//       tools: {},
//       resources: {},
//       prompts: {},
//     },
//   });

//   // Create person node
//   server.tool(
//     'create_person_node',
//     {
//       name: z.string().describe('Full name of the person'),
//       walletAddress: z.string().optional().describe('Solana wallet address (base58 encoded)'),
//       notes: z.string().optional().describe('Additional notes about the person'),
//       tags: z.array(z.string()).optional().describe('Tags to categorize the person'),
//     },
//     async ({ name, walletAddress, notes, tags }) => {
//       console.log(`👤 Node Management: Creating person node ${name}`);
      
//       try {
//         if (!globalCreatePersonNode) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         const personData = {
//           name,
//           walletAddress: walletAddress || '',
//           notes: notes || '',
//           tags: tags || []
//         };

//         const newPerson = await globalCreatePersonNode(personData);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Successfully created person "${name}"\n` +
//                   `📝 ID: ${newPerson.id}\n` +
//                   `${walletAddress ? `💰 Wallet: ${walletAddress}\n` : ''}` +
//                   `${notes ? `📄 Notes: ${notes}\n` : ''}` +
//                   `🏷️ Tags: ${tags?.join(', ') || 'None'}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error creating person node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to create person "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Edit person node
//   server.tool(
//     'edit_person_node',
//     {
//       id: z.string().describe('ID of the person to update'),
//       name: z.string().optional().describe('New name for the person'),
//       walletAddress: z.string().optional().describe('New Solana wallet address'),
//       notes: z.string().optional().describe('Updated notes about the person'),
//       tags: z.array(z.string()).optional().describe('Updated tags for the person'),
//     },
//     async ({ id, name, walletAddress, notes, tags }) => {
//       console.log(`👤 Node Management: Updating person node ${id}`);
      
//       try {
//         if (!globalUpdatePersonNode || !globalGetNodeById) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         // Check if person exists
//         const existingNode = globalGetNodeById(id);
//         if (!existingNode || existingNode.type !== 'person') {
//           return {
//             content: [{
//               type: 'text',
//               text: `❌ Person with ID "${id}" not found.`
//             }]
//           };
//         }

//         // Prepare updates
//         const updates: Partial<PersonNode> = {};
//         if (name !== undefined) updates.name = name;
//         if (walletAddress !== undefined) updates.walletAddress = walletAddress;
//         if (notes !== undefined) updates.notes = notes;
//         if (tags !== undefined) updates.tags = tags;

//         await globalUpdatePersonNode(id, updates);
        
//         // Get the updated node
//         const updatedPerson = globalGetNodeById?.(id) as PersonNode;
//         if (!updatedPerson) {
//           throw new Error('Could not retrieve updated person');
//         }

//         const updatesList = [];
//         if (name !== undefined) updatesList.push(`Name: ${name}`);
//         if (walletAddress !== undefined) updatesList.push(`Wallet: ${walletAddress}`);
//         if (notes !== undefined) updatesList.push(`Notes: ${notes}`);
//         if (tags !== undefined) updatesList.push(`Tags: ${tags.join(', ')}`);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Successfully updated person "${updatedPerson.name}"\n📝 Updates: ${updatesList.join(', ')}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error updating person node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to update person: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Create event node
//   server.tool(
//     'create_event_node',
//     {
//       name: z.string().describe('Name/title of the event'),
//       description: z.string().optional().describe('Description of the event'),
//       date: z.string().describe('Date of the event (ISO string)'),
//       endDate: z.string().optional().describe('End date of the event (ISO string)'),
//       location: z.string().optional().describe('Location of the event'),
//       eventType: z.enum(['conference', 'meetup', 'party', 'business', 'social', 'other']).describe('Type of event'),
//       organizer: z.string().optional().describe('Organizer name or person ID'),
//       tags: z.array(z.string()).optional().describe('Tags to categorize the event'),
//     },
//     async ({ name, description, date, endDate, location, eventType, organizer, tags }) => {
//       console.log(`📅 Node Management: Creating event node ${name}`);
      
//       try {
//         if (!globalCreateEventNode) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         const eventData: CreateEventNodeData = {
//           name,
//           description: description || '',
//           date: new Date(date),
//           endDate: endDate ? new Date(endDate) : undefined,
//           location: location || '',
//           eventType,
//           organizer: organizer || '',
//           tags: tags || []
//         };

//         const newEvent = await globalCreateEventNode(eventData);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Successfully created event "${name}"\n` +
//                   `📝 ID: ${newEvent.id}\n` +
//                   `📅 Date: ${newEvent.date.toLocaleDateString()}\n` +
//                   `📍 Location: ${newEvent.location || 'TBD'}\n` +
//                   `🎯 Type: ${newEvent.eventType}\n` +
//                   `🏷️ Tags: ${newEvent.tags?.join(', ') || 'None'}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error creating event node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to create event "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Create community node
//   server.tool(
//     'create_community_node',
//     {
//       name: z.string().describe('Name of the community'),
//       description: z.string().optional().describe('Description of the community'),
//       communityType: z.enum(['dao', 'nft', 'social', 'gaming', 'defi', 'business', 'other']).describe('Type of community'),
//       isPublic: z.boolean().optional().describe('Whether the community is public (default: true)'),
//       tags: z.array(z.string()).optional().describe('Tags to categorize the community'),
//     },
//     async ({ name, description, communityType, isPublic = true, tags }) => {
//       console.log(`🏘️ Node Management: Creating community node ${name}`);
      
//       try {
//         if (!globalCreateCommunityNode) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         const communityData: CreateCommunityNodeData = {
//           name,
//           description: description || '',
//           communityType,
//           isPublic,
//           tags: tags || []
//         };

//         const newCommunity = await globalCreateCommunityNode(communityData);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Successfully created community "${name}"\n` +
//                   `📝 ID: ${newCommunity.id}\n` +
//                   `🏘️ Type: ${newCommunity.communityType}\n` +
//                   `🔓 Public: ${newCommunity.isPublic ? 'Yes' : 'No'}\n` +
//                   `📄 Description: ${newCommunity.description || 'None'}\n` +
//                   `👥 Members: ${newCommunity.members?.length || 0}\n` +
//                   `🏷️ Tags: ${newCommunity.tags?.join(', ') || 'None'}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error creating community node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to create community "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Edit event node
//   server.tool(
//     'edit_event_node',
//     {
//       id: z.string().describe('ID of the event to update'),
//       name: z.string().optional().describe('New name for the event'),
//       description: z.string().optional().describe('New description for the event'),
//       date: z.string().optional().describe('New date for the event (ISO string)'),
//       endDate: z.string().optional().describe('New end date for the event (ISO string)'),
//       location: z.string().optional().describe('New location for the event'),
//       eventType: z.enum(['conference', 'meetup', 'party', 'business', 'social', 'other']).optional().describe('New type of event'),
//       organizer: z.string().optional().describe('New organizer name or person ID'),
//       tags: z.array(z.string()).optional().describe('New tags for the event'),
//     },
//     async ({ id, name, description, date, endDate, location, eventType, organizer, tags }) => {
//       console.log(`📅 Node Management: Updating event node ${id}`);
      
//       try {
//         if (!globalUpdateEventNode || !globalGetNodeById) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         // Check if event exists
//         const existingEvent = globalGetNodeById(id);
//         if (!existingEvent || existingEvent.type !== 'event') {
//           return {
//             content: [{
//               type: 'text',
//               text: `❌ Event with ID "${id}" not found.`
//             }]
//           };
//         }

//         const updates: UpdateEventNodeData = {};
//         if (name !== undefined) updates.name = name;
//         if (description !== undefined) updates.description = description;
//         if (date !== undefined) updates.date = new Date(date);
//         if (endDate !== undefined) updates.endDate = new Date(endDate);
//         if (location !== undefined) updates.location = location;
//         if (eventType !== undefined) updates.eventType = eventType;
//         if (organizer !== undefined) updates.organizer = organizer;
//         if (tags !== undefined) updates.tags = tags;

//         await globalUpdateEventNode(id, updates);

//         // Get updated event to show changes
//         const updatedEvent = globalGetNodeById(id);
//         if (!updatedEvent) {
//           throw new Error('Could not retrieve updated event');
//         }

//         const updatesList = [];
//         if (name !== undefined) updatesList.push(`Name: ${name}`);
//         if (description !== undefined) updatesList.push(`Description: ${description}`);
//         if (date !== undefined) updatesList.push(`Date: ${new Date(date).toLocaleDateString()}`);
//         if (endDate !== undefined) updatesList.push(`End Date: ${new Date(endDate).toLocaleDateString()}`);
//         if (location !== undefined) updatesList.push(`Location: ${location}`);
//         if (eventType !== undefined) updatesList.push(`Type: ${eventType}`);
//         if (organizer !== undefined) updatesList.push(`Organizer: ${organizer}`);
//         if (tags !== undefined) updatesList.push(`Tags: ${tags.join(', ')}`);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Successfully updated event "${updatedEvent.name}"\n📝 Updates: ${updatesList.join(', ')}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error updating event node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Edit community node
//   server.tool(
//     'edit_community_node',
//     {
//       id: z.string().describe('ID of the community to update'),
//       name: z.string().optional().describe('New name for the community'),
//       description: z.string().optional().describe('New description for the community'),
//       communityType: z.enum(['dao', 'nft', 'social', 'gaming', 'defi', 'business', 'other']).optional().describe('New type of community'),
//       isPublic: z.boolean().optional().describe('New public/private setting'),
//       tags: z.array(z.string()).optional().describe('New tags for the community'),
//     },
//     async ({ id, name, description, communityType, isPublic, tags }) => {
//       console.log(`🏘️ Node Management: Updating community node ${id}`);
      
//       try {
//         if (!globalUpdateCommunityNode || !globalGetNodeById) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         // Check if community exists
//         const existingCommunity = globalGetNodeById(id);
//         if (!existingCommunity || existingCommunity.type !== 'community') {
//           return {
//             content: [{
//               type: 'text',
//               text: `❌ Community with ID "${id}" not found.`
//             }]
//           };
//         }

//         const updates: UpdateCommunityNodeData = {};
//         if (name !== undefined) updates.name = name;
//         if (description !== undefined) updates.description = description;
//         if (communityType !== undefined) updates.communityType = communityType;
//         if (isPublic !== undefined) updates.isPublic = isPublic;
//         if (tags !== undefined) updates.tags = tags;

//         await globalUpdateCommunityNode(id, updates);

//         // Get updated community to show changes
//         const updatedCommunity = globalGetNodeById(id);
//         if (!updatedCommunity) {
//           throw new Error('Could not retrieve updated community');
//         }

//         const updatesList = [];
//         if (name !== undefined) updatesList.push(`Name: ${name}`);
//         if (description !== undefined) updatesList.push(`Description: ${description}`);
//         if (communityType !== undefined) updatesList.push(`Type: ${communityType}`);
//         if (isPublic !== undefined) updatesList.push(`Public: ${isPublic ? 'Yes' : 'No'}`);
//         if (tags !== undefined) updatesList.push(`Tags: ${tags.join(', ')}`);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Successfully updated community "${updatedCommunity.name}"\n📝 Updates: ${updatesList.join(', ')}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error updating community node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to update community: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // List all nodes
//   server.tool(
//     'list_nodes',
//     {
//       type: z.enum(['person', 'event', 'community', 'all']).optional().describe('Filter by node type'),
//     },
//     async ({ type = 'all' }) => {
//       console.log(`📋 Node Management: Listing nodes (${type})`);
      
//       try {
//         const allNodes = getAllNodes();
//         const filteredNodes = type === 'all' ? allNodes : allNodes.filter(node => node.type === type);
        
//         if (filteredNodes.length === 0) {
//           return {
//             content: [{
//               type: 'text',
//               text: `📝 No ${type === 'all' ? '' : type + ' '}nodes found. Use create-person-node, create-event-node, or create-community-node to create your first node.`
//             }]
//           };
//         }

//         const nodeList = filteredNodes.map(node => {
//           let details = `📋 ${node.name} (${node.type})`;
          
//           if (node.type === 'person') {
//             const person = node as PersonNode;
//             if (person.walletAddress) {
//               details += `\n  💰 ${person.walletAddress}`;
//             }
//             if (person.notes) {
//               details += `\n  📄 ${person.notes.slice(0, 50)}${person.notes.length > 50 ? '...' : ''}`;
//             }
//           } else if (node.type === 'event') {
//             const event = node as EventNode;
//             details += `\n  📅 ${event.date.toLocaleDateString()}`;
//             if (event.location) {
//               details += `\n  📍 ${event.location}`;
//             }
//             details += `\n  🎯 ${event.eventType}`;
//           } else if (node.type === 'community') {
//             const community = node as CommunityNode;
//             details += `\n  🏘️ ${community.communityType}`;
//             details += `\n  👥 ${community.members?.length || 0} members`;
//             details += `\n  🔓 ${community.isPublic ? 'Public' : 'Private'}`;
//           }
          
//           return details;
//         }).join('\n\n');

//         return {
//           content: [{
//             type: 'text',
//             text: `📋 Found ${filteredNodes.length} ${type === 'all' ? '' : type + ' '}node(s):\n\n${nodeList}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error listing nodes:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to list nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Search nodes
//   server.tool(
//     'search_nodes',
//     {
//       query: z.string().describe('Search query (name, wallet address, or notes)'),
//     },
//     async ({ query }) => {
//       console.log(`🔍 Node Management: Searching nodes for "${query}"`);
      
//       try {
//         const results = searchNodes(query);
        
//         if (results.length === 0) {
//           return {
//             content: [{
//               type: 'text',
//               text: `🔍 No nodes found matching "${query}"`
//             }]
//           };
//         }

//         const resultsList = results.map(node => {
//           let match = `📋 ${node.name} (${node.type})`;
          
//           if (node.type === 'person') {
//             const person = node as PersonNode;
//             if (person.walletAddress && person.walletAddress.includes(query)) {
//               match += `\n  💰 Wallet: ${person.walletAddress}`;
//             }
//             if (person.notes && person.notes.toLowerCase().includes(query.toLowerCase())) {
//               match += `\n  📄 Notes: ${person.notes.slice(0, 100)}`;
//             }
//           }
          
//           return match;
//         }).join('\n\n');

//         return {
//           content: [{
//             type: 'text',
//             text: `🔍 Found ${results.length} node(s) matching "${query}":\n\n${resultsList}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error searching nodes:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Failed to search nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   return server;
// }
