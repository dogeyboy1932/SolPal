import { Node, PersonNode, EventNode, CommunityNode } from '../types/nodes';

/**
 * Generate node-specific prompt suggestions based on node type and context
 */
export function generateNodeSpecificPrompts(node: Node): string[] {
  const basePrompts = [
    `Tell me about ${node.name}`,
    `What can you help me with regarding ${node.name}?`,
    `Show me details for ${node.name}`
  ];

  switch (node.type) {
    case 'person':
      const person = node as PersonNode;
      const personPrompts = [
        ...basePrompts,
        `Send SOL to ${person.name}`,
        `Check transaction history with ${person.name}`,
        `What's ${person.name}'s wallet address?`,
        `Schedule a meeting with ${person.name}`,
        `Add a note about ${person.name}`,
        person.relationship ? `How do I know ${person.name}?` : `What's my relationship with ${person.name}?`,
        person.email ? `Send an email to ${person.name}` : `Do you have contact info for ${person.name}?`,
        person.totalTransactions ? `How many transactions have I done with ${person.name}?` : `Have I sent money to ${person.name} before?`
      ];
      return personPrompts.filter(Boolean);

    case 'event':
      const event = node as EventNode;
      const eventPrompts = [
        ...basePrompts,
        `When is ${event.name}?`,
        `Where is ${event.name} happening?`,
        `How much does ${event.name} cost?`,
        `Who's going to ${event.name}?`,
        `Buy tickets for ${event.name}`,
        `Get directions to ${event.name}`,
        `Set a reminder for ${event.name}`,
        `Cancel my attendance to ${event.name}`,
        event.ticketPrice ? `How much are tickets to ${event.name}?` : `Is ${event.name} free?`,
        event.maxAttendees ? `How many people can attend ${event.name}?` : `Is there a limit for ${event.name}?`,
        event.location ? `How do I get to ${event.name}?` : `Where is ${event.name}?`,
        `Create a group chat for ${event.name} attendees`
      ];
      return eventPrompts.filter(Boolean);

    case 'community':
      const community = node as CommunityNode;
      const communityPrompts = [
        ...basePrompts,
        `Join ${community.name}`,
        `Leave ${community.name}`,
        `Who are the members of ${community.name}?`,
        `What's the purpose of ${community.name}?`,
        `How do I participate in ${community.name}?`,
        `Check ${community.name} activity`,
        `Make a proposal in ${community.name}`,
        `Vote on ${community.name} proposals`,
        community.governanceToken ? `What's ${community.name}'s governance token?` : `Does ${community.name} have a token?`,
        community.nftCollection ? `Show me ${community.name}'s NFT collection` : `Does ${community.name} have NFTs?`,
        community.isPublic ? `How do I join ${community.name}?` : `How do I get invited to ${community.name}?`,
        `Send tokens to ${community.name} treasury`,
        `Check ${community.name} treasury balance`
      ];
      return communityPrompts.filter(Boolean);

    default:
      return basePrompts;
  }
}

/**
 * Generate context-aware response templates for AI based on active nodes
 */
export function generateContextualResponseTemplates(activeNodes: Node[]): Record<string, string> {
  const templates: Record<string, string> = {
    greeting: "Hi! I can see you have access to ",
    transaction_help: "I can help you with Solana transactions. Based on your active nodes, ",
    node_suggestion: "You might want to ",
    no_context: "To provide better assistance, consider activating some nodes for context. "
  };

  if (activeNodes.length === 0) {
    templates.greeting = "Hi! To provide personalized assistance, try adding some people, events, or communities as context nodes.";
    templates.main_help = "I can help you with:\n• Creating and managing nodes (people, events, communities)\n• Solana transactions and wallet operations\n• Event planning and community management";
    return templates;
  }

  const nodeTypes = Array.from(new Set(activeNodes.map(n => n.type)));
  const hasPersons = nodeTypes.includes('person');
  const hasEvents = nodeTypes.includes('event');
  const hasCommunities = nodeTypes.includes('community');

  // Update greeting based on active nodes
  const nodeCount = activeNodes.length;
  const nodeTypeList = nodeTypes.join(', ');
  templates.greeting = `Hi! I can see you have ${nodeCount} active ${nodeCount === 1 ? 'node' : 'nodes'} (${nodeTypeList}). How can I help you today?`;

  // Transaction help based on persons
  if (hasPersons) {
    const persons = activeNodes.filter(n => n.type === 'person') as PersonNode[];
    const personsWithWallets = persons.filter(p => p.walletAddress).length;
    if (personsWithWallets > 0) {
      templates.transaction_help += `you have ${personsWithWallets} ${personsWithWallets === 1 ? 'person' : 'people'} with wallet addresses ready for transactions. `;
    }
  }

  // Event-specific help
  if (hasEvents) {
    const events = activeNodes.filter(n => n.type === 'event') as EventNode[];
    const upcomingEvents = events.filter(e => e.date > new Date()).length;
    if (upcomingEvents > 0) {
      templates.event_help = `You have ${upcomingEvents} upcoming ${upcomingEvents === 1 ? 'event' : 'events'}. I can help with ticket purchases, reminders, or attendee management.`;
    }
  }

  // Community-specific help
  if (hasCommunities) {
    const communities = activeNodes.filter(n => n.type === 'community') as CommunityNode[];
    const publicCommunities = communities.filter(c => c.isPublic).length;
    templates.community_help = `You're working with ${communities.length} ${communities.length === 1 ? 'community' : 'communities'}. I can help with governance, treasury management, or member interactions.`;
  }

  return templates;
}

/**
 * Generate smart action suggestions based on node context
 */
export function generateSmartSuggestions(activeNodes: Node[]): Array<{
  title: string;
  description: string;
  action: string;
  category: 'transaction' | 'event' | 'community' | 'social';
}> {
  const suggestions: Array<{
    title: string;
    description: string;
    action: string;
    category: 'transaction' | 'event' | 'community' | 'social';
  }> = [];

  activeNodes.forEach(node => {
    switch (node.type) {
      case 'person':
        const person = node as PersonNode;
        if (person.walletAddress) {
          suggestions.push({
            title: `Send SOL to ${person.name}`,
            description: `Quick transfer to ${person.name}'s wallet`,
            action: `send 0.1 SOL to ${person.name}`,
            category: 'transaction'
          });
        }
        suggestions.push({
          title: `Schedule with ${person.name}`,
          description: `Create an event with ${person.name}`,
          action: `create a meeting event with ${person.name}`,
          category: 'event'
        });
        break;

      case 'event':
        const event = node as EventNode;
        if (event.ticketPrice && event.date > new Date()) {
          suggestions.push({
            title: `Buy ticket for ${event.name}`,
            description: `Purchase ${event.ticketPrice} SOL ticket`,
            action: `buy ticket for ${event.name}`,
            category: 'transaction'
          });
        }
        suggestions.push({
          title: `Invite friends to ${event.name}`,
          description: `Share event with your contacts`,
          action: `who should I invite to ${event.name}?`,
          category: 'social'
        });
        break;

      case 'community':
        const community = node as CommunityNode;
        if (community.governanceToken) {
          suggestions.push({
            title: `Check ${community.name} governance`,
            description: `View active proposals and voting`,
            action: `show me ${community.name} governance proposals`,
            category: 'community'
          });
        }
        suggestions.push({
          title: `Engage with ${community.name}`,
          description: `Participate in community activities`,
          action: `what's happening in ${community.name}?`,
          category: 'community'
        });
        break;
    }
  });

  return suggestions.slice(0, 6); // Limit to 6 suggestions
}

/**
 * Analyze node relationships and suggest connections
 */
export function analyzeNodeRelationships(activeNodes: Node[]): Array<{
  suggestion: string;
  reasoning: string;
  action: string;
}> {
  const relationships: Array<{
    suggestion: string;
    reasoning: string;
    action: string;
  }> = [];

  const persons = activeNodes.filter(n => n.type === 'person') as PersonNode[];
  const events = activeNodes.filter(n => n.type === 'event') as EventNode[];
  const communities = activeNodes.filter(n => n.type === 'community') as CommunityNode[];

  // Suggest inviting people to events
  if (persons.length > 0 && events.length > 0) {
    const upcomingEvents = events.filter(e => e.date > new Date());
    upcomingEvents.forEach(event => {
      relationships.push({
        suggestion: `Invite ${persons.length} ${persons.length === 1 ? 'person' : 'people'} to ${event.name}`,
        reasoning: `You have both people and events in your context`,
        action: `invite all my contacts to ${event.name}`
      });
    });
  }

  // Suggest community connections
  if (persons.length > 0 && communities.length > 0) {
    const publicCommunities = communities.filter(c => c.isPublic);
    publicCommunities.forEach(community => {
      relationships.push({
        suggestion: `Invite friends to join ${community.name}`,
        reasoning: `Your contacts might be interested in this community`,
        action: `suggest ${community.name} to my contacts`
      });
    });
  }

  // Suggest event-community connections
  if (events.length > 0 && communities.length > 0) {
    events.forEach(event => {
      communities.forEach(community => {
        if (event.eventType === 'conference' || event.eventType === 'meetup') {
          relationships.push({
            suggestion: `Promote ${event.name} in ${community.name}`,
            reasoning: `This event might interest community members`,
            action: `share ${event.name} with ${community.name} members`
          });
        }
      });
    });
  }

  return relationships.slice(0, 4); // Limit suggestions
}
