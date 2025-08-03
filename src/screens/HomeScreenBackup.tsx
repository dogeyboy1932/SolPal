// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   SafeAreaView,
//   TouchableOpacity,
//   StyleSheet,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import AITransactionChat from '@/features/ai/AITransactionChat';
// import { ManualOperationsScreen } from './ManualOperationsScreen';
// import { WalletConnectButton } from '@/features/wallet/WalletConnectButton';

// export const HomeScreenBackup: React.FC = () => {
//   const [showManualMode, setShowManualMode] = useState(false);

//   return (
//     <SafeAreaView style={styles.container}>
//       {!showManualMode ? (
//         <View style={styles.content}>
//           {/* Header with Manual Mode Toggle */}
//           <View style={styles.header}>
//             <View style={styles.headerContent}>
//               <Text style={styles.title}>AI Solana Mobile</Text>
//               <Text style={styles.subtitle}>Your AI-powered Solana wallet</Text>
//             </View>

//             <WalletConnectButton />
            
//             <TouchableOpacity 
//               style={styles.manualModeButton} 
//               onPress={() => setShowManualMode(true)}
//             >
//               <Ionicons name="settings-outline" size={20} color="#007AFF" />
//               <Text style={styles.manualModeText}>Manual Mode</Text>
//             </TouchableOpacity>
//           </View>

//           {/* AI Chat Interface - Primary UI */}
//           <View style={styles.chatContainer}>
//             <AITransactionChat />
//           </View>
//         </View>
//       ) : (
//         <View style={styles.content}>
//           {/* Manual Operations Header */}
//           <View style={styles.manualHeader}>
//             <TouchableOpacity 
//               style={styles.backButton} 
//               onPress={() => setShowManualMode(false)}
//             >
//               <Ionicons name="arrow-back" size={24} color="#007AFF" />
//               <Text style={styles.backButtonText}>Back to AI Chat</Text>
//             </TouchableOpacity>
            
//             <Text style={styles.manualTitle}>Manual Operations</Text>
//             <Text style={styles.manualSubtitle}>Full control interface</Text>
//           </View>

//           {/* Manual Operations Interface */}
//           <View style={styles.manualContainer}>
//             <ManualOperationsScreen />
//           </View>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   content: {
//     flex: 1,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     backgroundColor: '#ffffff',
//   },
//   headerContent: {
//     flex: 1,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#111827',
//     marginBottom: 2,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#6b7280',
//   },
//   manualModeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f3f4f6',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 20,
//   },
//   manualModeText: {
//     color: '#3b82f6',
//     fontSize: 14,
//     fontWeight: '500',
//     marginLeft: 6,
//   },
//   chatContainer: {
//     flex: 1,
//   },
//   manualHeader: {
//     backgroundColor: '#f3f4f6',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   backButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   backButtonText: {
//     color: '#3b82f6',
//     fontSize: 16,
//     fontWeight: '500',
//     marginLeft: 8,
//   },
//   manualTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 2,
//   },
//   manualSubtitle: {
//     fontSize: 14,
//     color: '#6b7280',
//   },
//   manualContainer: {
//     flex: 1,
//   },
// });
