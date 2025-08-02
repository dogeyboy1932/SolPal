import { Node, NodeType } from '../types/nodes';

export interface AICommand {
  type: 'create_node' | 'edit_node' | 'delete_node' | 'view_node' | 'send_transaction' | 'get_balance' | 'unknown';
  action: string;
  nodeType?: NodeType;
  nodeId?: string;
  nodeName?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

export interface TransactionCommand {
  type: 'send_sol' | 'send_spl' | 'check_balance' | 'get_history';
  amount?: number;
  recipient?: string;
  recipientNode?: Node;
  tokenAddress?: string;
}

const NODE_CREATION_PATTERNS = [
  /create.*person.*named?\s+(.+)/i,
  /add.*person.*named?\s+(.+)/i,
  /new.*person.*named?\s+(.+)/i,
  /make.*person.*named?\s+(.+)/i,
  /create.*event.*called?\s+(.+)/i,
  /add.*event.*called?\s+(.+)/i,
  /new.*event.*called?\s+(.+)/i,
  /make.*event.*called?\s+(.+)/i,
  /create.*community.*called?\s+(.+)/i,
  /add.*community.*called?\s+(.+)/i,
  /new.*community.*called?\s+(.+)/i,
  /make.*community.*called?\s+(.+)/i,
];

const NODE_EDITING_PATTERNS = [
  /edit.*(?:person|event|community).*named?\s+(.+)/i,
  /update.*(?:person|event|community).*named?\s+(.+)/i,
  /modify.*(?:person|event|community).*named?\s+(.+)/i,
  /change.*(?:person|event|community).*named?\s+(.+)/i,
];

const TRANSACTION_PATTERNS = [
  /send\s+(\d+(?:\.\d+)?)\s+sol\s+to\s+(.+)/i,
  /transfer\s+(\d+(?:\.\d+)?)\s+sol\s+to\s+(.+)/i,
  /pay\s+(.+)\s+(\d+(?:\.\d+)?)\s+sol/i,
  /send\s+(\d+(?:\.\d+)?)\s+(.+)\s+to\s+(.+)/i, // For SPL tokens
];

const BALANCE_PATTERNS = [
  /(?:check|show|get|what.?s)\s+(?:my\s+)?balance/i,
  /how\s+much\s+(?:sol|money)\s+do\s+i\s+have/i,
  /balance/i,
];

const VIEW_NODE_PATTERNS = [
  /(?:show|view|tell\s+me\s+about)\s+(.+)/i,
  /(?:what|who)\s+is\s+(.+)/i,
  /(?:details|info|information)\s+(?:about\s+)?(.+)/i,
];

export class AICommandParser {
  static parseCommand(input: string, availableNodes: Node[]): AICommand {
    const normalizedInput = input.trim().toLowerCase();

    // Check for node creation commands
    const createCommand = this.parseNodeCreation(normalizedInput);
    if (createCommand.confidence > 0.7) {
      return createCommand;
    }

    // Check for node editing commands
    const editCommand = this.parseNodeEditing(normalizedInput, availableNodes);
    if (editCommand.confidence > 0.7) {
      return editCommand;
    }

    // Check for transaction commands
    const transactionCommand = this.parseTransaction(normalizedInput, availableNodes);
    if (transactionCommand.confidence > 0.7) {
      return transactionCommand;
    }

    // Check for balance commands
    const balanceCommand = this.parseBalance(normalizedInput);
    if (balanceCommand.confidence > 0.8) {
      return balanceCommand;
    }

    // Check for view node commands
    const viewCommand = this.parseViewNode(normalizedInput, availableNodes);
    if (viewCommand.confidence > 0.6) {
      return viewCommand;
    }

    // Default unknown command
    return {
      type: 'unknown',
      action: input,
      confidence: 0,
    };
  }

  private static parseNodeCreation(input: string): AICommand {
    for (const pattern of NODE_CREATION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        const nodeName = match[1]?.trim();
        if (!nodeName) continue;

        let nodeType: NodeType = 'person';
        if (input.includes('event')) {
          nodeType = 'event';
        } else if (input.includes('community')) {
          nodeType = 'community';
        }

        return {
          type: 'create_node',
          action: input,
          nodeType,
          nodeName,
          parameters: { name: nodeName },
          confidence: 0.9,
        };
      }
    }

    // Fallback patterns for less specific commands
    if (input.includes('create') || input.includes('add') || input.includes('new')) {
      if (input.includes('person') || input.includes('contact') || input.includes('friend')) {
        return {
          type: 'create_node',
          action: input,
          nodeType: 'person',
          confidence: 0.6,
        };
      }
      if (input.includes('event') || input.includes('meeting') || input.includes('appointment')) {
        return {
          type: 'create_node',
          action: input,
          nodeType: 'event',
          confidence: 0.6,
        };
      }
      if (input.includes('community') || input.includes('group') || input.includes('dao')) {
        return {
          type: 'create_node',
          action: input,
          nodeType: 'community',
          confidence: 0.6,
        };
      }
    }

    return { type: 'unknown', action: input, confidence: 0 };
  }

  private static parseNodeEditing(input: string, nodes: Node[]): AICommand {
    for (const pattern of NODE_EDITING_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        const nodeName = match[1]?.trim();
        if (!nodeName) continue;

        // Find matching node
        const foundNode = nodes.find(node => 
          node.name.toLowerCase().includes(nodeName.toLowerCase()) ||
          nodeName.toLowerCase().includes(node.name.toLowerCase())
        );

        if (foundNode) {
          return {
            type: 'edit_node',
            action: input,
            nodeId: foundNode.id,
            nodeName: foundNode.name,
            nodeType: foundNode.type,
            confidence: 0.9,
          };
        }
      }
    }

    return { type: 'unknown', action: input, confidence: 0 };
  }

  private static parseTransaction(input: string, nodes: Node[]): AICommand {
    for (const pattern of TRANSACTION_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        // Pattern 1: send X sol to Y
        if (pattern.source.includes('send.*sol.*to')) {
          const amount = parseFloat(match[1]);
          const recipient = match[2]?.trim();
          
          if (!isNaN(amount) && recipient) {
            // Try to find matching node
            const recipientNode = nodes.find(node => 
              node.name.toLowerCase().includes(recipient.toLowerCase()) ||
              recipient.toLowerCase().includes(node.name.toLowerCase())
            );

            return {
              type: 'send_transaction',
              action: input,
              parameters: {
                transactionType: 'send_sol',
                amount,
                recipient,
                recipientNode: recipientNode || null,
              },
              confidence: 0.9,
            };
          }
        }

        // Pattern 2: pay X Y sol (different order)
        if (pattern.source.includes('pay.*sol')) {
          const recipient = match[1]?.trim();
          const amount = parseFloat(match[2]);
          
          if (!isNaN(amount) && recipient) {
            const recipientNode = nodes.find(node => 
              node.name.toLowerCase().includes(recipient.toLowerCase()) ||
              recipient.toLowerCase().includes(node.name.toLowerCase())
            );

            return {
              type: 'send_transaction',
              action: input,
              parameters: {
                transactionType: 'send_sol',
                amount,
                recipient,
                recipientNode: recipientNode || null,
              },
              confidence: 0.9,
            };
          }
        }
      }
    }

    return { type: 'unknown', action: input, confidence: 0 };
  }

  private static parseBalance(input: string): AICommand {
    for (const pattern of BALANCE_PATTERNS) {
      if (pattern.test(input)) {
        return {
          type: 'get_balance',
          action: input,
          confidence: 0.9,
        };
      }
    }

    return { type: 'unknown', action: input, confidence: 0 };
  }

  private static parseViewNode(input: string, nodes: Node[]): AICommand {
    for (const pattern of VIEW_NODE_PATTERNS) {
      const match = input.match(pattern);
      if (match) {
        const query = match[1]?.trim();
        if (!query) continue;

        // Find matching node
        const foundNode = nodes.find(node => 
          node.name.toLowerCase().includes(query.toLowerCase()) ||
          query.toLowerCase().includes(node.name.toLowerCase())
        );

        if (foundNode) {
          return {
            type: 'view_node',
            action: input,
            nodeId: foundNode.id,
            nodeName: foundNode.name,
            nodeType: foundNode.type,
            confidence: 0.8,
          };
        }
      }
    }

    return { type: 'unknown', action: input, confidence: 0 };
  }

  static generateCommandSuggestions(nodes: Node[]): string[] {
    const suggestions: string[] = [
      // Node creation
      'Create a new person named John',
      'Add an event called Team Meeting',
      'Make a community called Dev Group',
      
      // Node management
      'Show me all my nodes',
      'Edit my event',
      
      // Transaction commands
      'Check my balance',
      'Send 0.1 SOL to Alice',
      'Transfer 0.05 SOL to my friend',
      
      // Node-specific commands
      ...nodes.slice(0, 3).map(node => `Tell me about ${node.name}`),
      ...nodes.filter(n => n.type === 'person').slice(0, 2).map(node => `Send 0.1 SOL to ${node.name}`),
    ];

    return suggestions.slice(0, 8); // Limit to 8 suggestions
  }

  static isActionableCommand(command: AICommand): boolean {
    return command.confidence > 0.7 && command.type !== 'unknown';
  }

  static formatCommandResponse(command: AICommand): string {
    switch (command.type) {
      case 'create_node':
        return `I'll help you create a new ${command.nodeType} ${command.nodeName ? `named "${command.nodeName}"` : ''}`;
      
      case 'edit_node':
        return `I'll help you edit ${command.nodeName}`;
      
      case 'view_node':
        return `Here's information about ${command.nodeName}`;
      
      case 'get_balance':
        return `I'll check your wallet balance`;
      
      case 'send_transaction':
        const params = command.parameters;
        if (params?.recipientNode) {
          return `I'll send ${params.amount} SOL to ${params.recipientNode.name}`;
        } else {
          return `I'll send ${params?.amount} SOL to ${params?.recipient}`;
        }
      
      default:
        return `I understand you want to: ${command.action}`;
    }
  }
}
