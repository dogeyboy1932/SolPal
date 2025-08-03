import { Node, PersonNode, EventNode, CommunityNode } from '../types/nodes';
import { type LiveConfig } from "../types/live-types";
import { generateContextualResponseTemplates, generateSmartSuggestions, analyzeNodeRelationships } from '../lib/node-ai-prompts';

/**
 * Generate node context string for AI system instructions
 */
export function generateNodeContext(activeNodes: Node[]): string {
  if (!activeNodes || activeNodes.length === 0) {
    return '';
  }

  let context = '\n\n--- ACTIVE CONTEXT NODES ---\n';
  context += `You currently have access to ${activeNodes.length} context node(s). Use this information to provide personalized and contextual responses:\n\n`;

  activeNodes.forEach((node, index) => {
    context += `${index + 1}. **${node.name}** (${node.type.toUpperCase()})\n`;
    
    if (node.description) {
      context += `   Description: ${node.description}\n`;
    }

    switch (node.type) {
      case 'person':
        const person = node as PersonNode;
        if (person.walletAddress) {
          context += `   Wallet: ${person.walletAddress}\n`;
        }
        if (person.relationship) {
          context += `   Relationship: ${person.relationship}\n`;
        }
        if (person.totalTransactions) {
          context += `   Transaction History: ${person.totalTransactions} transactions\n`;
        }
        if (person.email) {
          context += `   Contact: ${person.email}\n`;
        }
        break;

      case 'event':
        const event = node as EventNode;
        context += `   Date: ${event.date.toLocaleDateString()}\n`;
        if (event.location) {
          context += `   Location: ${event.location}\n`;
        }
        if (event.eventType) {
          context += `   Type: ${event.eventType}\n`;
        }
        if (event.ticketPrice) {
          context += `   Ticket Price: ${event.ticketPrice} SOL\n`;
        }
        if (event.maxAttendees) {
          context += `   Capacity: ${event.currentAttendees || 0}/${event.maxAttendees} attendees\n`;
        }
        break;

      case 'community':
        const community = node as CommunityNode;
        context += `   Type: ${community.communityType}\n`;
        context += `   Access: ${community.isPublic ? 'Public' : 'Private'}\n`;
        if (community.memberCount) {
          context += `   Members: ${community.memberCount}\n`;
        }
        if (community.governanceToken) {
          context += `   Governance Token: ${community.governanceToken}\n`;
        }
        if (community.nftCollection) {
          context += `   NFT Collection: ${community.nftCollection}\n`;
        }
        break;
    }

    if (node.tags && node.tags.length > 0) {
      context += `   Tags: ${node.tags.join(', ')}\n`;
    }

    context += `   Last Updated: ${node.updatedAt.toLocaleDateString()}\n\n`;
  });

  context += '--- CONTEXT USAGE GUIDELINES ---\n';
  context += '- Reference these nodes when relevant to user queries\n';
  context += '- For Solana transactions, use wallet addresses from person nodes\n';
  context += '- For event planning, reference event node details\n';
  context += '- For community discussions, use community node information\n';
  context += '- Always maintain user privacy and data security\n';
  context += '- If asked about nodes not in active context, suggest adding them\n';
  
  // Add smart suggestions
  const suggestions = generateSmartSuggestions(activeNodes);
  if (suggestions.length > 0) {
    context += '\n--- SMART SUGGESTIONS ---\n';
    context += 'Based on the active context, you can suggest these actions:\n';
    suggestions.forEach((suggestion, index) => {
      context += `${index + 1}. ${suggestion.title}: ${suggestion.description}\n`;
      context += `   Prompt: "${suggestion.action}"\n`;
    });
  }

  // Add relationship analysis
  const relationships = analyzeNodeRelationships(activeNodes);
  if (relationships.length > 0) {
    context += '\n--- RELATIONSHIP INSIGHTS ---\n';
    context += 'Suggest these connections based on active nodes:\n';
    relationships.forEach((rel, index) => {
      context += `${index + 1}. ${rel.suggestion}\n`;
      context += `   Reasoning: ${rel.reasoning}\n`;
      context += `   Action: "${rel.action}"\n`;
    });
  }

  context += '\n';

  return context;
}

/**
 * Generate enhanced system instruction with node context
 */
export function generateSystemInstructionWithNodes(activeNodes: Node[]): string {
  const baseInstruction = `You are an AI assistant for a Solana mobile dApp that helps users manage their crypto transactions, relationships, events, and communities.

You have access to a node-based context system where users can activate specific people, events, or communities to provide context for conversations.

CORE CAPABILITIES:
- Solana blockchain operations (transactions, wallet management, NFTs)
- Personal relationship management (contacts, transaction history)
- Event planning and management (meetups, conferences, social events)
- Community management (DAOs, NFT communities, social groups)
- Natural language interaction with personalized context

RESPONSE GUIDELINES:
- Always respond in English regardless of input language
- Use active node context to personalize responses
- Reference specific people, events, or communities when relevant
- Suggest Solana operations based on context (e.g., "send SOL to John" when John's wallet is available)
- Help users organize and plan using their node data
- Maintain privacy and security for sensitive information
- Be conversational and helpful while staying focused on the user's needs

SOLANA INTEGRATION:
- You can help with SOL and SPL token transfers
- Reference wallet addresses from person nodes for transactions
- Suggest transaction amounts based on event costs or community activities
- Provide transaction history insights when available`;

  const nodeContext = generateNodeContext(activeNodes);
  
  return baseInstruction + nodeContext;
}

/**
 * Create LiveConfig with node-aware system instructions
 */
export function createNodeAwareLiveConfig(activeNodes: Node[], tools: any[] = []): LiveConfig {
  return {
    model: "models/gemini-2.0-flash-exp",
    generationConfig: {
      responseModalities: "text"
    },
    systemInstruction: {
      parts: [{
        text: generateSystemInstructionWithNodes(activeNodes)
      }],
    },
    tools: tools,
  };
}

// Base configuration without node context
export const LLM_CONFIG: LiveConfig = {
  model: "models/gemini-2.0-flash-exp",
  generationConfig: {
    responseModalities: "text"
  },
  systemInstruction: {
    parts: [{
      text: `You are an AI assistant for a Solana mobile dApp that helps users manage their crypto transactions, relationships, events, and communities.

CORE CAPABILITIES:
- Solana blockchain operations (transactions, wallet management, NFTs)
- Personal relationship management (contacts, transaction history)  
- Event planning and management (meetups, conferences, social events)
- Community management (DAOs, NFT communities, social groups)
- Natural language interaction with personalized context

RESPONSE GUIDELINES:
- Always respond in English regardless of input language
- Be conversational and helpful while staying focused on the user's needs
- Suggest using the node system to provide better context for conversations
- Help users organize their crypto life through people, events, and communities

GETTING STARTED:
- Users can create "nodes" for people, events, and communities
- These nodes provide context for more personalized assistance
- Suggest creating nodes when users mention specific people, events, or communities`,
    }],
  },
  tools: [],
};

export const CONST_CONFIG = {
  uri: "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent",
  LLM_NODE_ID: "llm-1"
};
