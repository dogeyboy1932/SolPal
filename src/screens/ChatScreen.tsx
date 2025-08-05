// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   FlatList,
//   Modal,
//   Alert
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useGemini } from '../features/ai/GeminiContext';
// import { useNodes } from '../contexts/NodeContext';
// import { Node, NodeType } from '../types/nodes';
// import { PersonNodeForm } from '../features/nodes/forms/PersonNodeForm';
// import { EventNodeForm } from '../features/nodes/forms/EventNodeForm';
// import { CommunityNodeForm } from '../features/nodes/forms/CommunityNodeForm';
// import { SmartSuggestionsPanel, ConversationSuggestions } from '../features/ai/SmartSuggestions';

// interface Message {
//   id: string;
//   role: 'user' | 'assistant';
//   content: string;
//   timestamp: Date;
//   contextNodes?: Node[];
// }

// const NodeTypeColors = {
//   person: '#D97539', // warm-primary
//   event: '#E49B3F',  // accent-gold
//   community: '#B85C38' // warm-secondary
// };

// const NodeTypeIcons = {
//   person: '👤',
//   event: '📅',
//   community: '🏛️'
// };

// export const MainChatScreen: React.FC = () => {
//   const {
//     sendMessage,
//     messages: geminiMessages,
//     liveConnected,
//     setApiKey,
//     liveConnect,
//     updateNodeContext
//   } = useGemini();

//   const {
//     nodes,
//     activeNodes,
//     selectedNode,
//     selectNode,
//     addToActiveNodes,
//     removeFromActiveNodes,
//     clearActiveNodes
//   } = useNodes();

//   const [inputText, setInputText] = useState('');
//   const [apiKey, setApiKeyInput] = useState('');
//   const [showApiKeyModal, setShowApiKeyModal] = useState(false);
//   const [hasTriedConnection, setHasTriedConnection] = useState(false);
//   const [showNodeCreation, setShowNodeCreation] = useState(false);
//   const [nodeCreationType, setNodeCreationType] = useState<NodeType>('person');
//   const [showNodeList, setShowNodeList] = useState(false);

//   // Enhanced messages with context
//   const [contextualMessages, setContextualMessages] = useState<Message[]>([]);

//   // Mark connection attempt when already connected
//   React.useEffect(() => {
//     if (liveConnected && !hasTriedConnection) {
//       setHasTriedConnection(true);
//     }
//   }, [liveConnected, hasTriedConnection]);

//   // Auto-setup API key modal if not connected and haven't tried yet
//   React.useEffect(() => {
//     // Only show modal if:
//     // 1. Not connected
//     // 2. Haven't tried connecting yet
//     // 3. Modal isn't already showing
//     // 4. Connection is truly needed (not just a temporary navigation state)
//     if (!liveConnected && !hasTriedConnection && !showApiKeyModal) {
//       // Add a small delay to prevent showing modal during navigation
//       const timer = setTimeout(() => {
//         if (!liveConnected) {
//           setShowApiKeyModal(true);
//         }
//       }, 500);
      
//       return () => clearTimeout(timer);
//     }
//   }, [liveConnected, hasTriedConnection, showApiKeyModal]);

//   // Convert Gemini messages to contextual messages
//   React.useEffect(() => {
//     const enhancedMessages = geminiMessages.map(msg => ({
//       ...msg,
//       contextNodes: msg.role === 'assistant' ? activeNodes : undefined
//     }));
//     setContextualMessages(enhancedMessages);
//   }, [geminiMessages, activeNodes]);

//   // Update AI context when active nodes change (but only when meaningful changes occur)
//   React.useEffect(() => {
//     if (liveConnected) {
//       // Let updateNodeContext handle change detection internally
//       updateNodeContext(activeNodes);
//     }
//   }, [activeNodes, liveConnected, updateNodeContext]);

//   const handleSendMessage = useCallback(() => {
//     if (!inputText.trim() || !liveConnected) return;

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       role: 'user',
//       content: inputText.trim(),
//       timestamp: new Date(),
//       contextNodes: activeNodes.length > 0 ? [...activeNodes] : undefined
//     };

//     setContextualMessages(prev => [...prev, userMessage]);
//     sendMessage(inputText.trim());
//     setInputText('');
//   }, [inputText, liveConnected, sendMessage, activeNodes]);

//   const handleSuggestionPress = useCallback((suggestion: string) => {
//     setInputText(suggestion);
//   }, []);

//   const handleApiKeySubmit = async () => {
//     if (!apiKey.trim()) {
//       Alert.alert('Error', 'Please enter a valid API key');
//       return;
//     }

//     try {
//       setApiKey(apiKey.trim());
//       setHasTriedConnection(true); // Mark that we've tried connecting
//       await liveConnect();
//       setShowApiKeyModal(false);
//     } catch (error) {
//       Alert.alert('Error', 'Failed to connect with API key');
//     }
//   };

//   const handleNodeSelect = (node: Node) => {
//     if (activeNodes.find(n => n.id === node.id)) {
//       removeFromActiveNodes(node.id);
//     } else {
//       addToActiveNodes(node);
//     }
//   };

//   const handleCreateNode = (nodeType: NodeType) => {
//     setNodeCreationType(nodeType);
//     setShowNodeCreation(true);
//     setShowNodeList(false);
//   };

//   const renderMessage = ({ item }: { item: Message }) => (
//     <View className={`mx-4 my-1 p-3 rounded-2xl max-w-4/5 ${
//       item.role === 'user' 
//         ? 'bg-warm-primary self-end' 
//         : 'bg-surface-secondary self-start border border-warm-primary/20'
//     }`}>
//       <Text className={`text-base leading-6 ${
//         item.role === 'user' ? 'text-neutral-light' : 'text-neutral-light'
//       }`}>
//         {item.content}
//       </Text>
      
//       {item.contextNodes && item.contextNodes.length > 0 && (
//         <View className="mt-2 gap-1">
//           <Text className="text-xs text-neutral-medium font-medium">
//             Context:
//           </Text>
//           {item.contextNodes.map(node => (
//             <View 
//               key={node.id} 
//               className="px-2 py-1 rounded-xl self-start"
//               style={{ backgroundColor: NodeTypeColors[node.type] + '20' }}
//             >
//               <Text className="text-xs text-neutral-medium">
//                 {NodeTypeIcons[node.type]} {node.name}
//               </Text>
//             </View>
//           ))}
//         </View>
//       )}
      
//       <Text className="text-xs text-neutral-medium/70 mt-1">
//         {item.timestamp.toLocaleTimeString()}
//       </Text>
//     </View>
//   );

//   const renderNodeItem = ({ item }: { item: Node }) => {
//     const isActive = activeNodes.find(n => n.id === item.id);
//     const isSelected = selectedNode?.id === item.id;
    
//     return (
//       <TouchableOpacity
//         className={`bg-surface-secondary rounded-xl p-4 mb-3 border ${
//           isActive ? 'border-warm-primary bg-warm-primary/10' : 
//           isSelected ? 'bg-accent-amber/10' : 'border-warm-primary/20'
//         }`}
//         onPress={() => handleNodeSelect(item)}
//       >
//         <View className="flex-row items-center mb-2">
//           <Text className="text-2xl mr-3">
//             {NodeTypeIcons[item.type]}
//           </Text>
//           <View className="flex-1">
//             <Text className="text-base font-semibold text-neutral-light">
//               {item.name}
//             </Text>
//             <Text className="text-sm text-neutral-medium capitalize">
//               {item.type}
//             </Text>
//           </View>
//           {isActive && (
//             <Text className="text-base text-warm-primary font-bold">
//               ✓
//             </Text>
//           )}
//         </View>
//         {item.description && (
//           <Text className="text-sm text-neutral-medium leading-5" numberOfLines={2}>
//             {item.description}
//           </Text>
//         )}
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View className="flex-1 bg-surface-primary">
//       {/* Header */}
//       <View className="flex-row justify-between items-center px-5 py-4 bg-surface-secondary border-b border-warm-primary/20">
//         <Text className="text-xl font-bold text-neutral-light">
//           AI Assistant
//         </Text>
//         <View className="flex-row items-center gap-3">
//           <TouchableOpacity
//             className="px-3 py-1.5 bg-surface-primary/80 rounded-2xl"
//             onPress={() => setShowNodeList(true)}
//           >
//             <Text className="text-sm text-neutral-light font-medium">
//               Nodes ({nodes.length})
//             </Text>
//           </TouchableOpacity>
//           <View className={`w-3 h-3 rounded-full ${
//             liveConnected ? 'bg-green-500' : 'bg-red-500'
//           }`}>
//             <Text className="text-xs">
//               {liveConnected ? '🟢' : '🔴'}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Active Nodes Bar */}
//       {activeNodes.length > 0 && (
//         <View className="bg-surface-secondary border-b border-warm-primary/20 py-2">
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View className="flex-row items-center px-5 gap-2">
//               <Text className="text-sm text-neutral-medium font-medium">
//                 Active:
//               </Text>
//               {activeNodes.map(node => (
//                 <TouchableOpacity
//                   key={node.id}
//                   className="px-3 py-1.5 rounded-2xl"
//                   style={{ backgroundColor: NodeTypeColors[node.type] }}
//                   onPress={() => removeFromActiveNodes(node.id)}
//                 >
//                   <Text className="text-xs text-neutral-light font-medium">
//                     {NodeTypeIcons[node.type]} {node.name} ×
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//               <TouchableOpacity
//                 className="px-2 py-1"
//                 onPress={clearActiveNodes}
//               >
//                 <Text className="text-xs text-neutral-medium">
//                   Clear All
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </View>
//       )}

//       {/* Chat Messages */}
//       <KeyboardAvoidingView
//         className="flex-1"
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <FlatList
//           data={contextualMessages}
//           renderItem={renderMessage}
//           keyExtractor={(item) => item.id}
//           className="flex-1"
//           contentContainerStyle={{ paddingVertical: 10 }}
//           showsVerticalScrollIndicator={false}
//         />

//         {/* Smart Suggestions */}
//         <SmartSuggestionsPanel
//           activeNodes={activeNodes}
//           onSuggestionPress={handleSuggestionPress}
//           visible={liveConnected && activeNodes.length > 0}
//         />

//         {/* Conversation Suggestions */}
//         <ConversationSuggestions
//           activeNodes={activeNodes}
//           lastMessage={contextualMessages[contextualMessages.length - 1]?.content}
//           onSuggestionPress={handleSuggestionPress}
//         />

//         {/* Input Section */}
//         <View className="flex-row p-4 bg-surface-secondary border-t border-warm-primary/20 gap-3">
//           <TextInput
//             className="flex-1 border border-accent-amber/40 rounded-2xl px-4 py-2.5 text-base text-neutral-light bg-surface-primary max-h-24"
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Ask me anything about your nodes..."
//             placeholderTextColor="#8B7355"
//             multiline
//             maxLength={500}
//             editable={liveConnected}
//           />
//           <TouchableOpacity
//             className={`rounded-2xl px-5 justify-center ${
//               (!inputText.trim() || !liveConnected) 
//                 ? 'bg-neutral-medium/30' 
//                 : 'bg-warm-primary'
//             }`}
//             onPress={handleSendMessage}
//             disabled={!inputText.trim() || !liveConnected}
//           >
//             <Text className="text-neutral-light font-semibold">
//               Send
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>

//       {/* Floating Action Button */}
//       <TouchableOpacity
//         className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-warm-primary justify-center items-center shadow-lg"
//         onPress={() => setShowNodeList(true)}
//         style={{
//           elevation: 8,
//           ...(Platform.OS === 'web' ? {
//             boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
//           } : {
//             shadowColor: '#000',
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.25,
//             shadowRadius: 4,
//           }),
//         }}
//       >
//         <Text className="text-2xl text-neutral-light font-light">
//           +
//         </Text>
//       </TouchableOpacity>

//       {/* API Key Modal */}
//       <Modal
//         visible={showApiKeyModal}
//         animationType="slide"
//         presentationStyle="pageSheet"
//       >
//         <SafeAreaView className="flex-1 bg-surface-primary">
//           <View className="flex-1 p-5 justify-center">
//             <Text className="text-2xl font-bold text-neutral-light text-center mb-4">
//               Connect to AI
//             </Text>
//             <Text className="text-base text-neutral-medium text-center mb-8">
//               Enter your Google Gemini API key to start chatting with AI
//             </Text>
            
//             <TextInput
//               className="bg-surface-secondary border border-accent-amber/40 rounded-lg p-4 text-base text-neutral-light mb-6"
//               value={apiKey}
//               onChangeText={setApiKeyInput}
//               placeholder="Enter Gemini API Key"
//               placeholderTextColor="#8B7355"
//               secureTextEntry
//             />
            
//             <View className="gap-3">
//               <TouchableOpacity
//                 className="bg-warm-primary p-4 rounded-lg items-center"
//                 onPress={handleApiKeySubmit}
//               >
//                 <Text className="text-neutral-light text-base font-semibold">
//                   Connect
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </SafeAreaView>
//       </Modal>

//       {/* Node List Modal */}
//       <Modal
//         visible={showNodeList}
//         animationType="slide"
//         presentationStyle="pageSheet"
//       >
//         <SafeAreaView className="flex-1 bg-surface-primary">
//           <View className="flex-row justify-between items-center px-5 py-4 bg-surface-secondary border-b border-warm-primary/20">
//             <Text className="text-xl font-bold text-neutral-light">
//               Manage Nodes
//             </Text>
//             <TouchableOpacity onPress={() => setShowNodeList(false)}>
//               <Text className="text-base text-warm-primary font-semibold">
//                 Done
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {/* Node Creation Buttons */}
//           <View className="flex-row px-5 py-4 gap-3">
//             {(['person', 'event', 'community'] as NodeType[]).map(type => (
//               <TouchableOpacity
//                 key={type}
//                 className="flex-1 py-3 rounded-lg items-center"
//                 style={{ backgroundColor: NodeTypeColors[type] }}
//                 onPress={() => handleCreateNode(type)}
//               >
//                 <Text className="text-neutral-light text-sm font-semibold capitalize">
//                   {NodeTypeIcons[type]} {type}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Nodes List */}
//           <FlatList
//             data={nodes}
//             renderItem={renderNodeItem}
//             keyExtractor={(item) => item.id}
//             className="flex-1"
//             contentContainerStyle={{ paddingHorizontal: 20 }}
//           />
//         </SafeAreaView>
//       </Modal>

//       {/* Node Creation Modal */}
//       <Modal
//         visible={showNodeCreation}
//         animationType="slide"
//         presentationStyle="fullScreen"
//       >
//         <SafeAreaView className="flex-1 bg-surface-primary">
//           {nodeCreationType === 'person' && (
//             <PersonNodeForm
//               onSave={() => setShowNodeCreation(false)}
//               onCancel={() => setShowNodeCreation(false)}
//             />
//           )}
//           {nodeCreationType === 'event' && (
//             <EventNodeForm
//               onSave={() => setShowNodeCreation(false)}
//               onCancel={() => setShowNodeCreation(false)}
//             />
//           )}
//           {nodeCreationType === 'community' && (
//             <CommunityNodeForm
//               onSave={() => setShowNodeCreation(false)}
//               onCancel={() => setShowNodeCreation(false)}
//             />
//           )}
//         </SafeAreaView>
//       </Modal>
//     </View>
//   );
// };


