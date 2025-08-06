import { nftService } from './nftService';
import {
  PersonNode,
  EventNode,
  CommunityNode,
  Node,
  CreatePersonNodeData,
  CreateEventNodeData,
  CreateCommunityNodeData,
  UpdatePersonNodeData,
  UpdateEventNodeData,
  UpdateCommunityNodeData,
  NodeFilters,
  NodeType,
} from '../types/nodes';

export class NodeService {
  // Global variables to store Node context state setters and getters
  private createPersonNode:
    | ((node: CreatePersonNodeData) => Promise<PersonNode>)
    | null = null;
  public createEventNode:
    | ((node: CreateEventNodeData) => Promise<EventNode>)
    | null = null;
  public createCommunityNode:
    | ((node: CreateCommunityNodeData) => Promise<CommunityNode>)
    | null = null;
  public updatePersonNode:
    | ((id: string, updates: UpdatePersonNodeData) => Promise<void>)
    | null = null;
  public updateEventNode:
    | ((id: string, updates: UpdateEventNodeData) => Promise<void>)
    | null = null;
  public updateCommunityNode:
    | ((id: string, updates: UpdateCommunityNodeData) => Promise<void>)
    | null = null;
  private getNodes: (() => Node[]) | null = null;
  private getNodeById: ((id: string) => Node | undefined) | null = null;
  private searchNodes: ((filters: NodeFilters) => Node[]) | null = null;
  private getLLMAccessibleNodes: (() => Node[]) | null = null;

  // Initialize the global node management functions (call this from NodeContext)
  initializeNodeManagementFunctions(
    createPersonNode: (node: CreatePersonNodeData) => Promise<PersonNode>,
    createEventNode: (node: CreateEventNodeData) => Promise<EventNode>,
    createCommunityNode: (
      node: CreateCommunityNodeData
    ) => Promise<CommunityNode>,
    updatePersonNode: (
      id: string,
      updates: UpdatePersonNodeData
    ) => Promise<void>,
    updateEventNode: (
      id: string,
      updates: UpdateEventNodeData
    ) => Promise<void>,
    updateCommunityNode: (
      id: string,
      updates: UpdateCommunityNodeData
    ) => Promise<void>,
    getNodes: () => Node[],
    getNodeById: (id: string) => Node | undefined,
    searchNodes: (filters: NodeFilters) => Node[],
    getLLMAccessibleNodes: () => Node[]
  ) {
    this.createPersonNode = createPersonNode;
    this.createEventNode = createEventNode;
    this.createCommunityNode = createCommunityNode;
    this.updatePersonNode = updatePersonNode;
    this.updateEventNode = updateEventNode;
    this.updateCommunityNode = updateCommunityNode;
    this.getNodes = getNodes;
    this.getNodeById = getNodeById;
    this.searchNodes = searchNodes;
    this.getLLMAccessibleNodes = getLLMAccessibleNodes;
  }

  async signUpForEvent(
    eventId: string,
    personId: string
  ): Promise<{ success: boolean; event?: EventNode; person?: PersonNode }> {
    console.log('signUpForEvent called with:', { eventId, personId });
    if (!this.getNodeById || !this.updateEventNode || !this.updatePersonNode) {
      console.error('Node management functions not initialized');
      return { success: false };
    }

    const event = this.getNodeById(eventId) as EventNode;
    const person = this.getNodeById(personId) as PersonNode;
    console.log('Found event and person:', { event, person });

    if (!event || !person) {
      console.error('Event or person not found');
      return { success: false };
    }

    if (
      event.mintedNFTs &&
      event.maxAttendees &&
      event.mintedNFTs.length >= event.maxAttendees
    ) {
      console.log('Event is full');
      return { success: false };
    }

    const alreadySignedUp = person.ownedNFTs?.some(nft =>
      event.mintedNFTs?.includes(nft)
    );
    console.log('Already signed up:', alreadySignedUp);
    if (alreadySignedUp) {
      console.log(`${person.name} is already signed up for ${event.name}`);
      return { success: true, event, person };
    }

    const newNftMintAddress = await nftService.mintEventNFT(event, person);
    if (newNftMintAddress) {
      console.log(
        `${person.name} successfully signed up for ${event.name} by minting NFT ${newNftMintAddress}`
      );
      const updatedEvent = {
        ...event,
        attendees: [...(event.attendees || []), person.walletAddress!],
        mintedNFTs: [...(event.mintedNFTs || []), newNftMintAddress],
      };
      const updatedPerson = {
        ...person,
        ownedNFTs: [...(person.ownedNFTs || []), newNftMintAddress],
      };
      console.log('Updated event and person:', { updatedEvent, updatedPerson });
      return { success: true, event: updatedEvent, person: updatedPerson };
    }
    console.log(
      `Failed to mint NFT for ${person.name} for event ${event.name}`
    );
    return { success: false };
  }

  // Helper functions to access nodes
  getAllNodes(): Node[] {
    if (!this.getNodes) {
      console.error('Node management functions not initialized');
      return [];
    }
    return this.getNodes();
  }

  getLLMAccessibleNodesService(): Node[] {
    if (!this.getLLMAccessibleNodes) {
      console.error('Node management functions not initialized');
      return [];
    }
    return this.getLLMAccessibleNodes();
  }

  getNodeByIdService(id: string): Node | undefined {
    if (!this.getNodeById) {
      console.error('Node management functions not initialized');
      return undefined;
    }
    return this.getNodeById(id);
  }

  searchNodesBasic(query: string): Node[] {
    if (!this.searchNodes) {
      console.error('Node management functions not initialized');
      return [];
    }
    return this.searchNodes({ searchTerm: query });
  }

  // Find accessible nodes by name/identifier (for LLM use)
  findAccessibleNodeByName(name: string): Node | undefined {
    const accessibleNodes = this.getLLMAccessibleNodesService();
    return accessibleNodes.find(node =>
      node.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Find nodes by wallet address
  getNodeByWalletAddress(address: string): Node | undefined {
    const nodes = this.getLLMAccessibleNodesService();
    return nodes.find(node => {
      if (node.type === 'person') {
        return (node as PersonNode).walletAddress === address;
      }
      return false;
    });
  }

  getPersonNodeByPublicKey(publicKey: string): PersonNode | undefined {
    console.log('Searching for person node with public key:', publicKey);
    const nodes = this.getAllNodes();
    console.log('All nodes:', nodes);
    const personNode = nodes.find(node => {
      if (node.type === 'person') {
        console.log(
          'Checking person node:',
          node.name,
          (node as PersonNode).walletAddress
        );
        return (node as PersonNode).walletAddress === publicKey;
      }
      return false;
    }) as PersonNode | undefined;
    console.log('Found person node:', personNode);
    return personNode;
  }

  // Find nodes by name (fuzzy match)
  getNodeByName(name: string): Node | undefined {
    const nodes = this.getLLMAccessibleNodesService();
    return nodes.find(node =>
      node.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  // Get nodes with wallet addresses (for transaction targets)
  getNodesWithWallets(): Node[] {
    const nodes = this.getLLMAccessibleNodesService();
    return nodes.filter(node => {
      if (node.type === 'person') {
        return !!(node as PersonNode).walletAddress;
      }
      return false;
    });
  }

  // Service methods that return MCP-compatible responses

  async listAccessibleNodes(type?: string): Promise<any> {
    try {
      const accessibleNodes = this.getLLMAccessibleNodesService();
      const typeFilter = type as NodeType | undefined;

      let filteredNodes = accessibleNodes;
      if (typeFilter) {
        filteredNodes = accessibleNodes.filter(
          node => node.type === typeFilter
        );
      }

      if (filteredNodes.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                nodes: [],
                count: 0,
                message: typeFilter
                  ? `No ${typeFilter} nodes accessible to you. Ask the user to grant access to nodes in the Manual Operations tab.`
                  : 'No nodes accessible to you. Ask the user to grant access to nodes in the Manual Operations tab.',
              }),
            },
          ],
        };
      }

      const nodeList = filteredNodes.map(node => {
        let details: any = {
          id: node.id,
          name: node.name,
          type: node.type,
          createdAt: node.createdAt.toISOString(),
          description: node.description || null,
        };

        if (node.type === 'person') {
          const person = node as PersonNode;
          details.walletAddress = person.walletAddress || null;
          details.relationship = person.relationship || null;
          details.email = person.email || null;
          details.phone = person.phone || null;
          details.notes = person.notes || null;
        } else if (node.type === 'event') {
          const event = node as EventNode;
          details.date = event.date.toISOString();
          details.location = event.location || null;
          details.eventType = event.eventType || null;
          details.attendees = event.attendees?.length || 0;
        } else if (node.type === 'community') {
          const community = node as CommunityNode;
          details.communityType = community.communityType;
          details.isPublic = community.isPublic;
          details.memberCount = community.memberCount || 0;
        }

        return details;
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              nodes: nodeList,
              count: filteredNodes.length,
              message: `Retrieved ${filteredNodes.length} accessible nodes`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error listing accessible nodes:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to list accessible nodes',
            }),
          },
        ],
      };
    }
  }

  async createPersonNodeService(args: {
    name: string;
    walletAddress?: string;
    notes?: string;
    tags?: string[];
  }): Promise<any> {
    try {
      if (!this.createPersonNode) {
        throw new Error('Node management not initialized');
      }

      const newNode = await this.createPersonNode(args);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              node: {
                id: newNode.id,
                name: newNode.name,
                type: newNode.type,
                walletAddress: newNode.walletAddress || null,
              },
              message: `Successfully created person node: ${newNode.name}`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error creating person node:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to create person node',
            }),
          },
        ],
      };
    }
  }

  async getAllNodesService(): Promise<any> {
    try {
      const allNodes = this.getLLMAccessibleNodesService();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              nodes: allNodes.map(n => ({
                id: n.id,
                name: n.name,
                type: n.type,
                createdAt: n.createdAt.toISOString(),
              })),
              count: allNodes.length,
              message: `Retrieved ${allNodes.length} total nodes`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting all nodes:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to get all nodes',
            }),
          },
        ],
      };
    }
  }

  async searchNodesService(args: {
    query?: string;
    type?: string;
  }): Promise<any> {
    try {
      if (!this.searchNodes) {
        throw new Error('Node management not initialized');
      }

      const filters: NodeFilters = {};
      if (args.query) filters.searchTerm = args.query;
      if (args.type) filters.type = args.type as NodeType;

      const filteredNodes = this.searchNodes(filters);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              nodes: filteredNodes.map(n => ({
                id: n.id,
                name: n.name,
                type: n.type,
                createdAt: n.createdAt.toISOString(),
              })),
              count: filteredNodes.length,
              query: args.query || '',
              message: `Found ${filteredNodes.length} matching nodes`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error searching nodes:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to search nodes',
            }),
          },
        ],
      };
    }
  }

  async getNodesWithWalletsService(): Promise<any> {
    try {
      const nodesWithWallets = this.getNodesWithWallets();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              nodes: nodesWithWallets.map(n => ({
                id: n.id,
                name: n.name,
                type: n.type,
                walletAddress: (n as PersonNode).walletAddress,
              })),
              count: nodesWithWallets.length,
              message: `Found ${nodesWithWallets.length} contacts with wallet addresses`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting nodes with wallets:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to get nodes with wallets',
            }),
          },
        ],
      };
    }
  }

  async getNodeByWalletService(args: { address: string }): Promise<any> {
    try {
      const nodeByWallet = this.getNodeByWalletAddress(args.address);

      if (!nodeByWallet) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                node: null,
                message: `No contact found with wallet address: ${args.address}`,
              }),
            },
          ],
        };
      }

      const person = nodeByWallet as PersonNode;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              node: {
                id: person.id,
                name: person.name,
                type: person.type,
                walletAddress: person.walletAddress,
                relationship: person.relationship || null,
                notes: person.notes || null,
              },
              message: `Found contact: ${person.name}`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting node by wallet:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to get node by wallet address',
            }),
          },
        ],
      };
    }
  }

  async getNodeDetailsService(args: { id: string }): Promise<any> {
    try {
      const node = this.getNodeByIdService(args.id);

      if (!node) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                node: null,
                message: `Node not found with ID: ${args.id}`,
              }),
            },
          ],
        };
      }

      let details: any = {
        id: node.id,
        name: node.name,
        type: node.type,
        createdAt: node.createdAt.toISOString(),
        description: node.description || null,
      };

      if (node.type === 'person') {
        const person = node as PersonNode;
        details.walletAddress = person.walletAddress || null;
        details.relationship = person.relationship || null;
        details.email = person.email || null;
        details.phone = person.phone || null;
        details.notes = person.notes || null;
        details.tags = person.tags || [];
      } else if (node.type === 'event') {
        const event = node as EventNode;
        details.date = event.date.toISOString();
        details.location = event.location || null;
        details.eventType = event.eventType || null;
        details.attendees = event.attendees || [];
      } else if (node.type === 'community') {
        const community = node as CommunityNode;
        details.communityType = community.communityType;
        details.isPublic = community.isPublic;
        details.memberCount = community.memberCount || 0;
        details.tags = community.tags || [];
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              node: details,
              message: `Retrieved details for: ${node.name}`,
            }),
          },
        ],
      };
    } catch (error) {
      console.error('❌ Error getting node details:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to get node details',
            }),
          },
        ],
      };
    }
  }
}

export const nodeService = new NodeService();
