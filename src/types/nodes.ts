// Node type definitions for Person, Event, and Community entities

export type NodeType = 'person' | 'event' | 'community';

export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PersonNode extends BaseNode {
  type: 'person';
  walletAddress?: string;
  relationship?: 'friend' | 'family' | 'colleague' | 'business' | 'other';
  email?: string;
  phone?: string;
  notes?: string;
  lastTransactionDate?: Date;
  totalTransactions?: number;
  tags?: string[];
}

export interface EventNode extends BaseNode {
  type: 'event';
  date: Date;
  endDate?: Date;
  location?: string;
  eventType:
    | 'conference'
    | 'meetup'
    | 'party'
    | 'business'
    | 'social'
    | 'other';
  attendees?: string[]; // Array of person node IDs
  organizer?: string; // Person node ID or external organizer name
  ticketPrice?: number;
  maxAttendees?: number;
  currentAttendees?: number;
  requirements?: string;
  tags?: string[];
}

export interface CommunityNode extends BaseNode {
  type: 'community';
  communityType:
    | 'dao'
    | 'nft'
    | 'social'
    | 'gaming'
    | 'defi'
    | 'business'
    | 'other';
  members?: string[]; // Array of person node IDs
  memberCount?: number;
  isPublic: boolean;
  joinRequirements?: string;
  governanceToken?: string; // Token mint address
  nftCollection?: string; // NFT collection address
  website?: string;
  discord?: string;
  twitter?: string;
  admin?: string; // Person node ID
  tags?: string[];
}

// Union type for all node types
export type Node = PersonNode | EventNode | CommunityNode;

// Node creation interfaces (without generated fields)
export interface CreatePersonNodeData {
  name: string;
  description?: string;
  walletAddress?: string;
  relationship?: PersonNode['relationship'];
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

export interface CreateEventNodeData {
  name: string;
  description?: string;
  date: Date;
  endDate?: Date;
  location?: string;
  eventType: EventNode['eventType'];
  organizer?: string;
  ticketPrice?: number;
  maxAttendees?: number;
  requirements?: string;
  tags?: string[];
}

export interface CreateCommunityNodeData {
  name: string;
  description?: string;
  communityType: CommunityNode['communityType'];
  isPublic: boolean;
  joinRequirements?: string;
  governanceToken?: string;
  nftCollection?: string;
  website?: string;
  discord?: string;
  twitter?: string;
  tags?: string[];
}

// Node update interfaces
export type UpdatePersonNodeData = Partial<CreatePersonNodeData>;
export type UpdateEventNodeData = Partial<CreateEventNodeData>;
export type UpdateCommunityNodeData = Partial<CreateCommunityNodeData>;

// Node filter and search interfaces
export interface NodeFilters {
  type?: NodeType;
  isActive?: boolean;
  tags?: string[];
  searchTerm?: string;
}

// Node context for AI interactions
export interface NodeContext {
  selectedNode?: Node;
  recentlyUsedNodes?: Node[];
}

// AI prompt context interface
export interface AINodeContext {
  node: Node;
  relatedNodes?: Node[];
  transactionHistory?: {
    count: number;
    lastTransaction?: Date;
    totalAmount?: number;
  };
  contextSummary: string;
}
