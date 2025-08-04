import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Node, 
  PersonNode, 
  EventNode, 
  CommunityNode,
  CreatePersonNodeData,
  CreateEventNodeData,
  CreateCommunityNodeData,
  UpdatePersonNodeData,
  UpdateEventNodeData,
  UpdateCommunityNodeData,
  NodeFilters,
  NodeContext as NodeContextType,
  NodeType
} from '../types/nodes';
import { nodeService } from '@/services/nodeService';
// import { initializeNodeManagementFunctions } from '../mcpServers/combinedServer';

// Global variables to store Node context state setters and getters
let globalCreatePersonNode: ((node: CreatePersonNodeData) => Promise<PersonNode>) | null = null;
let globalCreateEventNode: ((node: CreateEventNodeData) => Promise<EventNode>) | null = null;
let globalCreateCommunityNode: ((node: CreateCommunityNodeData) => Promise<CommunityNode>) | null = null;
let globalUpdatePersonNode: ((id: string, updates: UpdatePersonNodeData) => Promise<void>) | null = null;
let globalUpdateEventNode: ((id: string, updates: UpdateEventNodeData) => Promise<void>) | null = null;
let globalUpdateCommunityNode: ((id: string, updates: UpdateCommunityNodeData) => Promise<void>) | null = null;
let globalGetNodes: (() => Node[]) | null = null;
let globalGetNodeById: ((id: string) => Node | undefined) | null = null;
let globalSearchNodes: ((filters: NodeFilters) => Node[]) | null = null;
let globalGetLLMAccessibleNodes: (() => Node[]) | null = null;

// Initialize the global node management functions (call this from NodeContext)
export function initializeNodeManagementFunctions(
  createPersonNode: (node: CreatePersonNodeData) => Promise<PersonNode>,
  createEventNode: (node: CreateEventNodeData) => Promise<EventNode>,
  createCommunityNode: (node: CreateCommunityNodeData) => Promise<CommunityNode>,
  updatePersonNode: (id: string, updates: UpdatePersonNodeData) => Promise<void>,
  updateEventNode: (id: string, updates: UpdateEventNodeData) => Promise<void>,
  updateCommunityNode: (id: string, updates: UpdateCommunityNodeData) => Promise<void>,
  getNodes: () => Node[],
  getNodeById: (id: string) => Node | undefined,
  searchNodes: (filters: NodeFilters) => Node[],
  getLLMAccessibleNodes: () => Node[]
) {
  // Initialize both the global variables (for backwards compatibility) and nodeService
  globalCreatePersonNode = createPersonNode;
  globalCreateEventNode = createEventNode;
  globalCreateCommunityNode = createCommunityNode;
  globalUpdatePersonNode = updatePersonNode;
  globalUpdateEventNode = updateEventNode;
  globalUpdateCommunityNode = updateCommunityNode;
  globalGetNodes = getNodes;
  globalGetNodeById = getNodeById;
  globalSearchNodes = searchNodes;
  globalGetLLMAccessibleNodes = getLLMAccessibleNodes;
  
  // Initialize nodeService with the same functions
  nodeService.initializeNodeManagementFunctions(
    createPersonNode,
    createEventNode,
    createCommunityNode,
    updatePersonNode,
    updateEventNode,
    updateCommunityNode,
    getNodes,
    getNodeById,
    searchNodes,
    getLLMAccessibleNodes
  );
}

interface NodeContextValue {
  // Node management
  nodes: Node[];
  activeNodes: Node[];
  selectedNode?: Node;
  
  // LLM Access Control
  llmAccessibleNodeIds: Set<string>;
  setNodeLLMAccessible: (nodeId: string, accessible: boolean) => void;
  toggleAllNodesLLMAccess: (accessible: boolean) => void;
  getLLMAccessibleNodes: () => Node[];
  
  // Node operations
  createPersonNode: (data: CreatePersonNodeData) => Promise<PersonNode>;
  createEventNode: (data: CreateEventNodeData) => Promise<EventNode>;
  createCommunityNode: (data: CreateCommunityNodeData) => Promise<CommunityNode>;
  
  updatePersonNode: (id: string, data: UpdatePersonNodeData) => Promise<void>;
  updateEventNode: (id: string, data: UpdateEventNodeData) => Promise<void>;
  updateCommunityNode: (id: string, data: UpdateCommunityNodeData) => Promise<void>;
  
  deleteNode: (id: string) => Promise<void>;
  setNodeActive: (id: string, isActive: boolean) => Promise<void>;
  
  // Node selection and context
  selectNode: (node: Node | undefined) => void;
  addToActiveNodes: (node: Node) => void;
  removeFromActiveNodes: (nodeId: string) => void;
  clearActiveNodes: () => void;
  
  // Node queries
  getNodeById: (id: string) => Node | undefined;
  getNodesByType: (type: NodeType) => Node[];
  searchNodes: (filters: NodeFilters) => Node[];
  
  // AI context
  getNodeContext: () => NodeContextType;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
}

const NodeContext = createContext<NodeContextValue | undefined>(undefined);

const STORAGE_KEY = 'solana_nodes_data';
const LLM_ACCESS_STORAGE_KEY = 'solana_nodes_llm_access';

export const NodeProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [activeNodes, setActiveNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | undefined>();
  const [llmAccessibleNodeIds, setLlmAccessibleNodeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load nodes from storage on mount
  useEffect(() => {
    loadNodes();
    loadLLMAccessSettings();
  }, []);

  // Save nodes to storage whenever nodes change
  useEffect(() => {
    if (!isLoading) {
      saveNodes();
    }
  }, [nodes, isLoading]);

  // Initialize nodeManagement MCP functions whenever nodes change
  useEffect(() => {
    if (!isLoading) {
      // Initialize the nodeManagement MCP server with current state
      initializeNodeManagementFunctions(
        createPersonNode,
        createEventNode,
        createCommunityNode,
        updatePersonNode,
        updateEventNode,
        updateCommunityNode,
        () => nodes,
        getNodeById,
        searchNodes,
        getLLMAccessibleNodes
      );
      console.log('🔗 NodeManagement MCP functions initialized with', nodes.length, 'nodes (', llmAccessibleNodeIds.size, 'LLM accessible)');
    }
  }, [nodes, activeNodes, llmAccessibleNodeIds, isLoading]);

  const loadNodes = async () => {
    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedNodes = JSON.parse(storedData);
        // Convert date strings back to Date objects
        const hydratedNodes = parsedNodes.map((node: any) => ({
          ...node,
          createdAt: new Date(node.createdAt),
          updatedAt: new Date(node.updatedAt),
          ...(node.type === 'event' && {
            date: new Date(node.date),
            endDate: node.endDate ? new Date(node.endDate) : undefined,
            lastTransactionDate: node.lastTransactionDate ? new Date(node.lastTransactionDate) : undefined
          }),
          ...(node.type === 'person' && {
            lastTransactionDate: node.lastTransactionDate ? new Date(node.lastTransactionDate) : undefined
          })
        }));
        setNodes(hydratedNodes);
      }
    } catch (err) {
      setError('Failed to load nodes from storage');
      console.error('Error loading nodes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNodes = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
    } catch (err) {
      console.error('Error saving nodes:', err);
      setError('Failed to save nodes to storage');
    }
  };

  // LLM Access Control Functions
  const loadLLMAccessSettings = async () => {
    try {
      const storedAccess = await AsyncStorage.getItem(LLM_ACCESS_STORAGE_KEY);
      if (storedAccess) {
        const accessArray = JSON.parse(storedAccess);
        setLlmAccessibleNodeIds(new Set(accessArray));
      }
    } catch (err) {
      console.error('Error loading LLM access settings:', err);
    }
  };

  const saveLLMAccessSettings = async (accessSet: Set<string>) => {
    try {
      await AsyncStorage.setItem(LLM_ACCESS_STORAGE_KEY, JSON.stringify(Array.from(accessSet)));
    } catch (err) {
      console.error('Error saving LLM access settings:', err);
    }
  };

  const setNodeLLMAccessible = useCallback((nodeId: string, accessible: boolean) => {
    setLlmAccessibleNodeIds(prev => {
      const newSet = new Set(prev);
      if (accessible) {
        newSet.add(nodeId);
      } else {
        newSet.delete(nodeId);
      }
      saveLLMAccessSettings(newSet);
      return newSet;
    });
  }, []);

  const toggleAllNodesLLMAccess = useCallback((accessible: boolean) => {
    if (accessible) {
      const allNodeIds = new Set(nodes.map(node => node.id));
      setLlmAccessibleNodeIds(allNodeIds);
      saveLLMAccessSettings(allNodeIds);
    } else {
      setLlmAccessibleNodeIds(new Set());
      saveLLMAccessSettings(new Set());
    }
  }, [nodes]);

  const getLLMAccessibleNodes = useCallback(() => {
    return nodes.filter(node => llmAccessibleNodeIds.has(node.id));
  }, [nodes, llmAccessibleNodeIds]);

  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const createPersonNode = useCallback(async (data: CreatePersonNodeData): Promise<PersonNode> => {
    const newNode: PersonNode = {
      id: generateId(),
      type: 'person',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      totalTransactions: 0
    };

    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, []);

  const createEventNode = useCallback(async (data: CreateEventNodeData): Promise<EventNode> => {
    const newNode: EventNode = {
      id: generateId(),
      type: 'event',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      currentAttendees: 0,
      attendees: []
    };

    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, []);

  const createCommunityNode = useCallback(async (data: CreateCommunityNodeData): Promise<CommunityNode> => {
    const newNode: CommunityNode = {
      id: generateId(),
      type: 'community',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      memberCount: 0,
      members: []
    };

    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, []);

  const updatePersonNode = useCallback(async (id: string, data: UpdatePersonNodeData) => {
    setNodes(prev => prev.map(node => 
      node.id === id && node.type === 'person' 
        ? { ...node, ...data, updatedAt: new Date() }
        : node
    ));
  }, []);

  const updateEventNode = useCallback(async (id: string, data: UpdateEventNodeData) => {
    setNodes(prev => prev.map(node => 
      node.id === id && node.type === 'event' 
        ? { ...node, ...data, updatedAt: new Date() }
        : node
    ));
  }, []);

  const updateCommunityNode = useCallback(async (id: string, data: UpdateCommunityNodeData) => {
    setNodes(prev => prev.map(node => 
      node.id === id && node.type === 'community' 
        ? { ...node, ...data, updatedAt: new Date() }
        : node
    ));
  }, []);

  const deleteNode = useCallback(async (id: string) => {
    setNodes(prev => prev.filter(node => node.id !== id));
    setActiveNodes(prev => prev.filter(node => node.id !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(undefined);
    }
  }, [selectedNode]);

  const setNodeActive = useCallback(async (id: string, isActive: boolean) => {
    setNodes(prev => prev.map(node => 
      node.id === id 
        ? { ...node, isActive, updatedAt: new Date() }
        : node
    ));
    
    if (!isActive) {
      setActiveNodes(prev => prev.filter(node => node.id !== id));
      if (selectedNode?.id === id) {
        setSelectedNode(undefined);
      }
    }
  }, [selectedNode]);

  const selectNode = useCallback((node: Node | undefined) => {
    setSelectedNode(node);
    if (node && !activeNodes.find(n => n.id === node.id)) {
      addToActiveNodes(node);
    }
  }, [activeNodes]);

  const addToActiveNodes = useCallback((node: Node) => {
    setActiveNodes(prev => {
      const exists = prev.find(n => n.id === node.id);
      if (exists) return prev;
      return [...prev, node];
    });
  }, []);

  const removeFromActiveNodes = useCallback((nodeId: string) => {
    setActiveNodes(prev => prev.filter(node => node.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(undefined);
    }
  }, [selectedNode]);

  const clearActiveNodes = useCallback(() => {
    setActiveNodes([]);
    setSelectedNode(undefined);
  }, []);

  const getNodeById = useCallback((id: string): Node | undefined => {
    console.log(nodes)
    return nodes.find(node => node.id === id);
  }, [nodes]);

  const getNodesByType = useCallback((type: NodeType): Node[] => {
    return nodes.filter(node => node.type === type);
  }, [nodes]);

  const searchNodes = useCallback((filters: NodeFilters): Node[] => {
    return nodes.filter(node => {
      if (filters.type && node.type !== filters.type) return false;
      if (filters.isActive !== undefined && node.isActive !== filters.isActive) return false;
      if (filters.tags && filters.tags.length > 0) {
        const nodeTags = node.tags || [];
        if (!filters.tags.some(tag => nodeTags.includes(tag))) return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(searchLower) ||
          (node.description && node.description.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [nodes]);

  const getNodeContext = useCallback((): NodeContextType => {
    return {
      activeNodes,
      selectedNode,
      recentlyUsedNodes: activeNodes.slice(0, 5) // Last 5 active nodes
    };
  }, [activeNodes, selectedNode]);

  const contextValue: NodeContextValue = {
    nodes,
    activeNodes,
    selectedNode,
    llmAccessibleNodeIds,
    setNodeLLMAccessible,
    toggleAllNodesLLMAccess,
    getLLMAccessibleNodes,
    createPersonNode,
    createEventNode,
    createCommunityNode,
    updatePersonNode,
    updateEventNode,
    updateCommunityNode,
    deleteNode,
    setNodeActive,
    selectNode,
    addToActiveNodes,
    removeFromActiveNodes,
    clearActiveNodes,
    getNodeById,
    getNodesByType,
    searchNodes,
    getNodeContext,
    isLoading,
    error
  };

  return (
    <NodeContext.Provider value={contextValue}>
      {children}
    </NodeContext.Provider>
  );
};

export const useNodes = () => {
  const context = useContext(NodeContext);
  if (context === undefined) {
    throw new Error('useNodes must be used within a NodeProvider');
  }
  return context;
};
