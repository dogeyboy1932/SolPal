import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodes } from '../../contexts/NodeContext';
import { useWallet } from '../../contexts/WalletContext';
import { useGemini } from './GeminiContext';
import { PersonNode, Node } from '../../types/nodes';

interface TransactionSuggestion {
  id: string;
  type: 'frequent_contact' | 'event_payment' | 'community_contribution' | 'safety_warning';
  title: string;
  description: string;
  amount?: number;
  recipient?: string;
  recipientNode?: PersonNode;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  action: () => void;
}

interface TransactionInsight {
  type: 'spending_pattern' | 'gas_optimization' | 'security_recommendation' | 'relationship_analysis';
  title: string;
  description: string;
  recommendation?: string;
  icon: string;
  severity: 'info' | 'warning' | 'success';
}

export const SmartTransactionFeatures: React.FC = () => {
  const { nodes } = useNodes();
  const { connected, balance, publicKey } = useWallet();
  const { sendMessage, isConnected: aiConnected, messages } = useGemini();
  const [suggestions, setSuggestions] = useState<TransactionSuggestion[]>([]);
  const [insights, setInsights] = useState<TransactionInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // Mock transaction history for analysis (in real app, this would come from blockchain)
  const mockTransactionHistory = [
    { to: '7uHfNvh...', amount: 0.5, timestamp: Date.now() - 86400000, type: 'send' },
    { to: '9xKmP2v...', amount: 1.0, timestamp: Date.now() - 172800000, type: 'send' },
    { to: '7uHfNvh...', amount: 0.25, timestamp: Date.now() - 259200000, type: 'send' },
  ];

  const generateSmartSuggestions = useCallback((): TransactionSuggestion[] => {
    const suggestions: TransactionSuggestion[] = [];
    
    // Get person nodes with wallet addresses
    const personsWithWallets = nodes.filter(
      (node): node is PersonNode => 
        node.type === 'person' && !!(node as PersonNode).walletAddress
    ) as PersonNode[];

    // Frequent contact suggestions
    personsWithWallets.forEach((person, index) => {
      if (index < 3) { // Limit to top 3
        suggestions.push({
          id: `frequent-${person.id}`,
          type: 'frequent_contact',
          title: `Send to ${person.name}`,
          description: `${person.relationship || 'Contact'} • Quick send option`,
          recipientNode: person,
          recipient: person.walletAddress,
          priority: 'medium',
          icon: 'person',
          color: '#007AFF',
          action: () => handleQuickSend(person)
        });
      }
    });

    // Event-based suggestions
    const upcomingEvents = nodes.filter(node => 
      node.type === 'event' && 
      new Date((node as any).date) > new Date()
    );

    upcomingEvents.forEach(event => {
      suggestions.push({
        id: `event-${event.id}`,
        type: 'event_payment',
        title: `Pay for ${event.name}`,
        description: `Upcoming event • ${new Date((event as any).date).toLocaleDateString()}`,
        amount: (event as any).ticketPrice || 0.1,
        priority: 'high',
        icon: 'calendar',
        color: '#28a745',
        action: () => handleEventPayment(event)
      });
    });

    // Low balance warning
    if (balance !== null && balance < 0.1) {
      suggestions.push({
        id: 'low-balance-warning',
        type: 'safety_warning',
        title: 'Low SOL Balance',
        description: 'Consider adding more SOL for transaction fees',
        priority: 'high',
        icon: 'warning',
        color: '#FF6B35',
        action: () => showBalanceWarning()
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [nodes, balance]);

  const generateTransactionInsights = useCallback((): TransactionInsight[] => {
    const insights: TransactionInsight[] = [];

    // Spending pattern analysis
    if (mockTransactionHistory.length > 0) {
      const totalSpent = mockTransactionHistory.reduce((sum, tx) => sum + tx.amount, 0);
      const avgTransaction = totalSpent / mockTransactionHistory.length;
      
      insights.push({
        type: 'spending_pattern',
        title: 'Transaction Pattern Analysis',
        description: `You've sent ${totalSpent.toFixed(2)} SOL across ${mockTransactionHistory.length} transactions`,
        recommendation: `Average transaction: ${avgTransaction.toFixed(3)} SOL`,
        icon: 'analytics',
        severity: 'info'
      });
    }

    // Gas optimization
    insights.push({
      type: 'gas_optimization',
      title: 'Transaction Fee Optimization',
      description: 'Solana transactions typically cost ~0.000005 SOL',
      recommendation: 'Your transaction fees are very low compared to other blockchains',
      icon: 'flash',
      severity: 'success'
    });

    // Security recommendations
    insights.push({
      type: 'security_recommendation',
      title: 'Security Best Practices',
      description: 'Always verify recipient addresses before sending',
      recommendation: 'Use your saved contacts to avoid address mistakes',
      icon: 'shield-checkmark',
      severity: 'warning'
    });

    // Relationship analysis
    const personNodes = nodes.filter(node => node.type === 'person');
    if (personNodes.length > 0) {
      insights.push({
        type: 'relationship_analysis',
        title: 'Contact Network Analysis',
        description: `You have ${personNodes.length} contacts saved`,
        recommendation: personNodes.length < 5 
          ? 'Consider adding more frequent contacts for easier transactions'
          : 'Great! You have a well-organized contact list',
        icon: 'people',
        severity: 'info'
      });
    }

    return insights;
  }, [nodes, mockTransactionHistory]);

  const handleQuickSend = (person: PersonNode) => {
    Alert.alert(
      `Send SOL to ${person.name}`,
      `Wallet: ${person.walletAddress?.slice(0, 8)}...${person.walletAddress?.slice(-8)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send 0.1 SOL', onPress: () => executeSend(person.walletAddress!, 0.1) },
        { text: 'Send 0.5 SOL', onPress: () => executeSend(person.walletAddress!, 0.5) },
        { text: 'Custom Amount', onPress: () => showCustomSendModal(person) }
      ]
    );
  };

  const handleEventPayment = (event: Node) => {
    const eventData = event as any;
    Alert.alert(
      `Pay for ${event.name}`,
      `Amount: ${eventData.ticketPrice || 0.1} SOL\nDate: ${new Date(eventData.date).toLocaleDateString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => executeEventPayment(eventData) }
      ]
    );
  };

  const showBalanceWarning = () => {
    Alert.alert(
      'Low Balance Warning',
      `Your current balance is ${balance?.toFixed(4)} SOL. You may need more SOL for transaction fees.`,
      [
        { text: 'OK' },
        { text: 'Get SOL', onPress: () => showGetSOLOptions() }
      ]
    );
  };

  const executeSend = async (recipient: string, amount: number) => {
    try {
      // This would integrate with the actual transaction system
      Alert.alert('Success', `Would send ${amount} SOL to ${recipient.slice(0, 8)}...${recipient.slice(-8)}`);
    } catch (error) {
      Alert.alert('Error', 'Transaction failed. Please try again.');
    }
  };

  const executeEventPayment = async (eventData: any) => {
    try {
      // This would integrate with event payment system
      Alert.alert('Success', `Would pay ${eventData.ticketPrice || 0.1} SOL for ${eventData.name}`);
    } catch (error) {
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  const showCustomSendModal = (person: PersonNode) => {
    // This would open a custom amount input modal
    Alert.alert('Custom Amount', 'Custom amount input would open here');
  };

  const showGetSOLOptions = () => {
    Alert.alert(
      'Get SOL',
      'You can get SOL from exchanges like Coinbase, Binance, or use Solana faucets for devnet.',
      [{ text: 'OK' }]
    );
  };

  const refreshAnalysis = async () => {
    setIsAnalyzing(true);
    // Generate local suggestions and insights
    setSuggestions(generateSmartSuggestions());
    setInsights(generateTransactionInsights());
    setIsAnalyzing(false);
  };

  const requestAIAnalysis = async () => {
    if (!aiConnected) {
      Alert.alert('AI Unavailable', 'Please connect to AI first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const context = `I want smart transaction analysis. I have ${balance?.toFixed(4)} SOL and ${nodes.length} contacts saved.`;
      sendMessage(`Please analyze my transaction patterns and provide smart suggestions. Use generate_smart_suggestions with context: "${context}", walletBalance: ${balance}. Then use analyze_transaction_insights for a comprehensive analysis.`);
      
      setShowAIAnalysis(true);
      Alert.alert('AI Analysis Requested', 'Check the chat for AI-powered transaction insights and suggestions.');
    } catch (error) {
      Alert.alert('Error', 'Failed to request AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performSafetyCheck = async (type: string, recipient?: string, amount?: number) => {
    if (!aiConnected) {
      Alert.alert('AI Unavailable', 'Safety check requires AI connection');
      return;
    }

    try {
      setIsAnalyzing(true);
      const params = {
        transactionType: type,
        recipient,
        amount,
        urgency: 'medium'
      };
      
      sendMessage(`Please perform a safety check for my transaction using smart_safety_check with these parameters: ${JSON.stringify(params)}`);
      
      Alert.alert(
        'Safety Check Requested',
        'AI is analyzing your transaction. Check the chat for safety recommendations.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Safety check failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (connected) {
      setSuggestions(generateSmartSuggestions());
      setInsights(generateTransactionInsights());
    }
  }, [connected, generateSmartSuggestions, generateTransactionInsights]);

  if (!connected) {
    return (
      <View className="p-5 items-center">
        <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
        <Text className="text-lg font-semibold text-gray-700 mt-4">Connect Wallet</Text>
        <Text className="text-sm text-gray-500 text-center mt-2">
          Connect your wallet to see smart transaction suggestions
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-5 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">Smart Transactions</Text>
            <Text className="text-sm text-gray-600">AI-powered transaction assistance</Text>
          </View>
          <TouchableOpacity 
            className="bg-blue-500 px-4 py-2 rounded-lg flex-row items-center"
            onPress={refreshAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh" size={16} color="white" />
            )}
            <Text className="text-white text-sm font-medium ml-2">
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Analysis Section */}
      <View className="p-5 bg-gradient-to-r from-purple-50 to-blue-50">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">🤖 AI-Powered Analysis</Text>
          </View>
          <View className="flex-row items-center">
            <View 
              className={`w-2 h-2 rounded-full mr-2 ${aiConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <Text className={`text-xs font-medium ${aiConnected ? 'text-green-600' : 'text-red-600'}`}>
              {aiConnected ? 'AI Connected' : 'AI Offline'}
            </Text>
          </View>
        </View>
        
        <View className="flex-row gap-3">
          <TouchableOpacity 
            className={`flex-1 rounded-lg p-3 flex-row items-center justify-center ${
              aiConnected ? 'bg-purple-500' : 'bg-gray-300'
            }`}
            onPress={requestAIAnalysis}
            disabled={!aiConnected || isAnalyzing}
          >
            <Ionicons 
              name="analytics" 
              size={16} 
              color={aiConnected ? "white" : "#9CA3AF"} 
            />
            <Text className={`ml-2 text-sm font-medium ${
              aiConnected ? 'text-white' : 'text-gray-500'
            }`}>
              AI Analysis
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`flex-1 rounded-lg p-3 flex-row items-center justify-center ${
              aiConnected ? 'bg-orange-500' : 'bg-gray-300'
            }`}
            onPress={() => performSafetyCheck('transfer')}
            disabled={!aiConnected || isAnalyzing}
          >
            <Ionicons 
              name="shield-checkmark" 
              size={16} 
              color={aiConnected ? "white" : "#9CA3AF"} 
            />
            <Text className={`ml-2 text-sm font-medium ${
              aiConnected ? 'text-white' : 'text-gray-500'
            }`}>
              Safety Check
            </Text>
          </TouchableOpacity>
        </View>
        
        {!aiConnected && (
          <Text className="text-xs text-gray-500 text-center mt-3">
            Connect to AI for advanced transaction analysis and safety checks
          </Text>
        )}
      </View>

      {/* Smart Suggestions */}
      <View className="p-5">
        <Text className="text-lg font-semibold text-gray-900 mb-4">💡 Smart Suggestions</Text>
        {suggestions.length === 0 ? (
          <View className="bg-white rounded-xl p-6 items-center">
            <Ionicons name="bulb-outline" size={32} color="#D1D5DB" />
            <Text className="text-gray-500 text-center mt-2">
              No suggestions available. Add contacts or events to get personalized recommendations.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
                onPress={suggestion.action}
              >
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: suggestion.color + '20' }}
                >
                  <Ionicons 
                    name={suggestion.icon as any} 
                    size={24} 
                    color={suggestion.color} 
                  />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-base font-semibold text-gray-900 flex-1">
                      {suggestion.title}
                    </Text>
                    {suggestion.priority === 'high' && (
                      <View className="bg-red-100 rounded-full px-2 py-1">
                        <Text className="text-red-600 text-xs font-medium">HIGH</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">
                    {suggestion.description}
                  </Text>
                  {suggestion.amount && (
                    <Text className="text-sm font-medium text-green-600 mt-1">
                      Amount: {suggestion.amount} SOL
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Transaction Insights */}
      <View className="p-5">
        <Text className="text-lg font-semibold text-gray-900 mb-4">📊 Transaction Insights</Text>
        <View className="gap-3">
          {insights.map((insight, index) => (
            <View
              key={index}
              className="bg-white rounded-xl p-4 border-l-4"
              style={{ 
                borderLeftColor: 
                  insight.severity === 'warning' ? '#F59E0B' :
                  insight.severity === 'success' ? '#10B981' : '#6B7280'
              }}
            >
              <View className="flex-row items-start">
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name={insight.icon as any} 
                    size={20} 
                    color={
                      insight.severity === 'warning' ? '#F59E0B' :
                      insight.severity === 'success' ? '#10B981' : '#6B7280'
                    }
                  />
                  <Text className="text-base font-semibold text-gray-900 ml-2 flex-1">
                    {insight.title}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-600 mt-2">
                {insight.description}
              </Text>
              {insight.recommendation && (
                <Text className="text-sm font-medium text-blue-600 mt-2">
                  💡 {insight.recommendation}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
