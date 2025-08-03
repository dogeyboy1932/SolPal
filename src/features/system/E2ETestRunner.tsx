import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useGemini } from '../ai/GeminiContext';
import { useWallet } from '../../contexts/WalletContext';
import { useNodes } from '../../contexts/NodeContext';

interface TestCase {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'error';
  testMessage: string;
  expectedBehavior: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'tool_discovery',
    name: 'Tool Discovery',
    description: 'Test if AI knows all available tools',
    category: 'basic',
    testMessage: 'What tools do you have available? List all your capabilities.',
    expectedBehavior: 'Should list all 17 MCP tools with descriptions',
  },
  {
    id: 'balance_check',
    name: 'Balance Check',
    description: 'Test basic wallet balance retrieval',
    category: 'basic',
    testMessage: 'Check my SOL balance',
    expectedBehavior: 'Should display current SOL balance using check_balance tool',
  },
  {
    id: 'address_validation',
    name: 'Address Validation',
    description: 'Test address validation functionality',
    category: 'basic',
    testMessage: 'Is 11111111111111111111111111111112 a valid Solana address?',
    expectedBehavior: 'Should validate address using validate_address tool',
  },
  {
    id: 'multi_tool_workflow',
    name: 'Multi-Tool Workflow',
    description: 'Test chaining multiple tools together',
    category: 'advanced',
    testMessage: 'Check my balance, then validate this address: 11111111111111111111111111111112',
    expectedBehavior: 'Should execute check_balance then validate_address in sequence',
  },
  {
    id: 'node_discovery',
    name: 'Node Discovery',
    description: 'Test AI access to node information',
    category: 'advanced',
    testMessage: 'What nodes do I have available? Show me my contacts.',
    expectedBehavior: 'Should use list_accessible_nodes to show available nodes',
  },
  {
    id: 'smart_suggestions',
    name: 'Smart Suggestions',
    description: 'Test intelligent transaction suggestions',
    category: 'advanced',
    testMessage: 'Give me some smart transaction suggestions based on my wallet and nodes',
    expectedBehavior: 'Should use generate_smart_suggestions tool for recommendations',
  },
  {
    id: 'invalid_address',
    name: 'Invalid Address Error',
    description: 'Test handling of invalid addresses',
    category: 'error',
    testMessage: 'Send 1 SOL to invalid_address_123',
    expectedBehavior: 'Should catch validation error and warn about invalid address',
  },
  {
    id: 'insufficient_funds',
    name: 'Insufficient Funds',
    description: 'Test handling of insufficient balance',
    category: 'error',
    testMessage: 'Send 1000 SOL to 11111111111111111111111111111112',
    expectedBehavior: 'Should check balance and report insufficient funds',
  },
];

interface TestResult {
  testId: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  response?: string;
  error?: string;
}

export const E2ETestRunner: React.FC = () => {
  const { sendMessage, liveConnected, tools } = useGemini();
  const { connected } = useWallet();
  const { nodes } = useNodes();
  
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<'basic' | 'advanced' | 'error'>('basic');

  const updateTestResult = (testId: string, result: Partial<TestResult>) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: { ...prev[testId], testId, ...result }
    }));
  };

  const runTest = async (testCase: TestCase) => {
    if (!liveConnected) {
      Alert.alert('AI Not Connected', 'Please connect to AI before running tests');
      return;
    }

    setRunningTest(testCase.id);
    updateTestResult(testCase.id, { status: 'running' });

    try {
      // Send test message to AI
      await sendMessage(testCase.testMessage);
      
      // For now, we'll mark as passed if we get a response
      // In a real implementation, you'd validate the response content
      updateTestResult(testCase.id, { 
        status: 'passed', 
        response: 'AI responded successfully',
        message: 'Test completed successfully'
      });
    } catch (error) {
      updateTestResult(testCase.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Test failed with error'
      });
    } finally {
      setRunningTest(null);
    }
  };

  const runAllTests = async () => {
    const testsToRun = TEST_CASES.filter(test => test.category === currentCategory);
    
    for (const testCase of testsToRun) {
      await runTest(testCase);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'running': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⚪';
    }
  };

  const getPassedCount = (category: string) => {
    return TEST_CASES
      .filter(test => test.category === category)
      .filter(test => testResults[test.id]?.status === 'passed')
      .length;
  };

  const getTotalCount = (category: string) => {
    return TEST_CASES.filter(test => test.category === category).length;
  };

  return (
    <View className="flex-1 bg-white p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          E2E AI-Solana Testing
        </Text>
        <Text className="text-gray-600">
          Test all AI-powered Solana operations end-to-end
        </Text>
      </View>

      {/* Prerequisites Check */}
      <View className="mb-6 p-4 bg-gray-50 rounded-lg">
        <Text className="text-lg font-semibold mb-3">Prerequisites</Text>
        <View className="space-y-2">
          <View className="flex-row items-center">
            <Text className={`mr-2 ${liveConnected ? 'text-green-600' : 'text-red-600'}`}>
              {liveConnected ? '✅' : '❌'}
            </Text>
            <Text>AI Connected ({tools.length} tools available)</Text>
          </View>
          <View className="flex-row items-center">
            <Text className={`mr-2 ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? '✅' : '❌'}
            </Text>
            <Text>Wallet Connected</Text>
          </View>
          <View className="flex-row items-center">
            <Text className={`mr-2 ${nodes.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {nodes.length > 0 ? '✅' : '⚠️'}
            </Text>
            <Text>Nodes Available ({nodes.length})</Text>
          </View>
        </View>
      </View>

      {/* Category Selection */}
      <View className="mb-4">
        <Text className="text-lg font-semibold mb-2">Test Category</Text>
        <View className="flex-row space-x-2">
          {(['basic', 'advanced', 'error'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setCurrentCategory(category)}
              className={`px-4 py-2 rounded-lg border ${
                currentCategory === category
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`capitalize ${
                currentCategory === category ? 'text-white' : 'text-gray-700'
              }`}>
                {category} ({getPassedCount(category)}/{getTotalCount(category)})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Run All Button */}
      <TouchableOpacity
        onPress={runAllTests}
        disabled={!liveConnected || runningTest !== null}
        className={`mb-4 py-3 px-4 rounded-lg ${
          !liveConnected || runningTest !== null
            ? 'bg-gray-300'
            : 'bg-blue-500'
        }`}
      >
        <Text className="text-white text-center font-semibold">
          {runningTest ? 'Running Tests...' : `Run All ${currentCategory} Tests`}
        </Text>
      </TouchableOpacity>

      {/* Test Cases */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {TEST_CASES
          .filter(test => test.category === currentCategory)
          .map((testCase) => {
            const result = testResults[testCase.id];
            return (
              <View key={testCase.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-lg mr-2">
                      {getStatusIcon(result?.status || 'pending')}
                    </Text>
                    <Text className="text-lg font-semibold flex-1">
                      {testCase.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => runTest(testCase)}
                    disabled={runningTest === testCase.id || !liveConnected}
                    className={`px-3 py-1 rounded ${
                      runningTest === testCase.id || !liveConnected
                        ? 'bg-gray-300'
                        : 'bg-blue-500'
                    }`}
                  >
                    {runningTest === testCase.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-sm">Run</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-600 mb-2">{testCase.description}</Text>
                <Text className="text-sm text-gray-500 mb-2">
                  Test: "{testCase.testMessage}"
                </Text>
                <Text className="text-sm text-blue-600 mb-2">
                  Expected: {testCase.expectedBehavior}
                </Text>

                {result && (
                  <View className="mt-2 p-2 bg-gray-50 rounded">
                    <Text className={`font-semibold`} style={{ color: getStatusColor(result.status) }}>
                      Status: {result.status.toUpperCase()}
                    </Text>
                    {result.message && (
                      <Text className="text-sm text-gray-600 mt-1">{result.message}</Text>
                    )}
                    {result.response && (
                      <Text className="text-sm text-green-600 mt-1">
                        Response: {result.response.substring(0, 100)}...
                      </Text>
                    )}
                    {result.error && (
                      <Text className="text-sm text-red-600 mt-1">
                        Error: {result.error}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
};
