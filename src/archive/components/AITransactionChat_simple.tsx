// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Animated,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useWallet } from '../contexts/WalletContext';
// import { useNodes } from '../contexts/NodeContext';
// import { useGemini } from '../ai/GeminiContext';

// interface ChatMessage {
//   id: string;
//   type: 'user' | 'ai' | 'system';
//   content: string;
//   timestamp: Date;
// }

// export default function AITransactionChat() {
//   const { connected, publicKey } = useWallet();
//   const { nodes } = useNodes();
//   const { sendMessage, messages, liveConnected, liveConnect, tools } = useGemini();
  
//   const [inputText, setInputText] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
  
//   const scrollViewRef = useRef<ScrollView>(null);
//   const pulseAnim = useRef(new Animated.Value(1)).current;

//   // Auto-connect to Gemini Live when component mounts
//   useEffect(() => {
//     const autoConnect = async () => {
//       if (!liveConnected) {
//         console.log('🚀 Auto-connecting to Gemini Live...');
//         try {
//           const success = await liveConnect(tools);
//           if (success) {
//             console.log('✅ Auto-connected to Gemini Live');
//           } else {
//             console.log('⚠️ Failed to auto-connect to Gemini Live');
//           }
//         } catch (error) {
//           console.error('❌ Error auto-connecting to Gemini Live:', error);
//         }
//       }
//     };

//     autoConnect();
//   }, []); // Run once on mount

//   // Animate AI thinking indicator
//   useEffect(() => {
//     if (isLoading) {
//       const pulse = Animated.sequence([
//         Animated.timing(pulseAnim, {
//           toValue: 0.7,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//         Animated.timing(pulseAnim, {
//           toValue: 1,
//           duration: 800,
//           useNativeDriver: true,
//         }),
//       ]);
//       Animated.loop(pulse).start();
//     } else {
//       pulseAnim.setValue(1);
//     }
//   }, [isLoading]);

//   const handleSendMessage = async () => {
//     if (!inputText.trim()) return;

//     setIsLoading(true);
//     try {
//       await sendMessage(inputText.trim());
//       setInputText('');
      
//       // Scroll to bottom
//       setTimeout(() => {
//         scrollViewRef.current?.scrollToEnd({ animated: true });
//       }, 100);
//     } catch (error) {
//       console.error('Error sending message:', error);
//       Alert.alert('Error', 'Failed to send message. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Always show main chat interface
//   return (
//     <KeyboardAvoidingView 
//       style={{ flex: 1, backgroundColor: '#FFFFFF' }}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       {/* Header */}
//       <View style={{ 
//         backgroundColor: '#007AFF',
//         paddingTop: 60, 
//         paddingBottom: 20, 
//         paddingHorizontal: 20 
//       }}>
//         <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
//           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//             <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
//               <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
//             </Animated.View>
//             <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginLeft: 12 }}>
//               AI Transaction Chat
//             </Text>
//           </View>
          
//           {/* Status Indicators */}
//           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//             {/* Connection Status */}
//             <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
//               {liveConnected ? (
//                 <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
//               ) : (
//                 <Ionicons name="time" size={20} color="#FFA726" />
//               )}
//             </View>
            
//             {/* Tools Indicator */}
//             <View style={{ 
//               backgroundColor: 'rgba(255,255,255,0.2)', 
//               borderRadius: 12, 
//               paddingHorizontal: 8, 
//               paddingVertical: 4 
//             }}>
//               <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
//                 {tools.length} tools
//               </Text>
//             </View>
//           </View>
//         </View>
//       </View>

//       {/* Messages */}
//       <ScrollView 
//         ref={scrollViewRef}
//         style={{ flex: 1, backgroundColor: '#F2F2F7' }}
//         contentContainerStyle={{ padding: 16 }}
//         onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
//       >
//         {messages.map((message) => (
//           <View
//             key={message.id}
//             style={{
//               alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
//               backgroundColor: message.role === 'user' ? '#007AFF' : '#FFFFFF',
//               borderRadius: 18,
//               paddingHorizontal: 16,
//               paddingVertical: 12,
//               marginVertical: 4,
//               maxWidth: '85%',
//               shadowColor: '#000',
//               shadowOffset: { width: 0, height: 1 },
//               shadowOpacity: 0.1,
//               shadowRadius: 2,
//               elevation: 2,
//             }}
//           >
//             <Text
//               style={{
//                 color: message.role === 'user' ? '#FFFFFF' : '#1C1C1E',
//                 fontSize: 16,
//                 lineHeight: 22,
//               }}
//             >
//               {message.content}
//             </Text>
//             <Text
//               style={{
//                 color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : '#8E8E93',
//                 fontSize: 12,
//                 marginTop: 4,
//               }}
//             >
//               {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//             </Text>
//           </View>
//         ))}
        
//         {/* AI Thinking Indicator */}
//         {isLoading && (
//           <View
//             style={{
//               alignSelf: 'flex-start',
//               backgroundColor: '#FFFFFF',
//               borderRadius: 18,
//               paddingHorizontal: 16,
//               paddingVertical: 12,
//               marginVertical: 4,
//               maxWidth: '85%',
//               shadowColor: '#000',
//               shadowOffset: { width: 0, height: 1 },
//               shadowOpacity: 0.1,
//               shadowRadius: 2,
//               elevation: 2,
//             }}
//           >
//             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//               <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
//               <Text style={{ color: '#8E8E93', fontSize: 16 }}>AI is thinking...</Text>
//             </View>
//           </View>
//         )}
//       </ScrollView>

//       {/* Connection Status Banner */}
//       {!connected && (
//         <View style={{ 
//           backgroundColor: '#FFF3CD', 
//           borderColor: '#FFEAA7', 
//           borderWidth: 1, 
//           padding: 12, 
//           marginHorizontal: 16 
//         }}>
//           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//             <Ionicons name="warning" size={20} color="#B86100" />
//             <Text style={{ color: '#856404', fontSize: 14, marginLeft: 8, flex: 1 }}>
//               Wallet not connected. Connect wallet to access transaction tools.
//             </Text>
//           </View>
//         </View>
//       )}

//       {/* Input Area */}
//       <View style={{ 
//         backgroundColor: '#FFFFFF', 
//         borderTopWidth: 1, 
//         borderTopColor: '#E5E5EA',
//         paddingTop: 12,
//         paddingBottom: 12,
//         paddingHorizontal: 16
//       }}>
//         {/* Text Input */}
//         <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
//           <TextInput
//             style={{
//               flex: 1,
//               backgroundColor: '#F2F2F7',
//               borderRadius: 20,
//               paddingHorizontal: 16,
//               paddingVertical: 12,
//               fontSize: 16,
//               maxHeight: 100,
//               marginRight: 8,
//             }}
//             placeholder={connected ? "Ask me anything about Solana..." : "Connect wallet to enable transactions"}
//             value={inputText}
//             onChangeText={setInputText}
//             multiline
//             onSubmitEditing={() => {
//               if (inputText.trim()) {
//                 handleSendMessage();
//               }
//             }}
//             editable={true} // Always allow typing
//           />
          
//           <TouchableOpacity
//             style={{
//               backgroundColor: inputText.trim() ? '#007AFF' : '#E5E5EA',
//               borderRadius: 20,
//               width: 40,
//               height: 40,
//               justifyContent: 'center',
//               alignItems: 'center',
//             }}
//             onPress={handleSendMessage}
//             disabled={!inputText.trim()}
//           >
//             <Ionicons 
//               name="send" 
//               size={20} 
//               color={inputText.trim() ? '#FFFFFF' : '#8E8E93'} 
//             />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }
