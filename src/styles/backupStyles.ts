import { StyleSheet } from 'react-native';

// Backup styles that replicate Tailwind classes for critical components
export const backupStyles = StyleSheet.create({
  // Layout
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  itemsCenter: { alignItems: 'center' },
  
  // Colors and Backgrounds
  bgWhite: { backgroundColor: '#ffffff' },
  bgGray50: { backgroundColor: '#f9fafb' },
  bgGray100: { backgroundColor: '#f3f4f6' },
  bgGray200: { backgroundColor: '#e5e7eb' },
  bgBlue50: { backgroundColor: '#eff6ff' },
  bgBlue500: { backgroundColor: '#3b82f6' },
  bgGreen100: { backgroundColor: '#dcfce7' },
  bgGreen500: { backgroundColor: '#22c55e' },
  bgRed500: { backgroundColor: '#ef4444' },
  bgYellow500: { backgroundColor: '#eab308' },
  
  // Text Colors
  textWhite: { color: '#ffffff' },
  textGray500: { color: '#6b7280' },
  textGray600: { color: '#4b5563' },
  textGray700: { color: '#374151' },
  textGray800: { color: '#1f2937' },
  textGray900: { color: '#111827' },
  textBlue500: { color: '#3b82f6' },
  textBlue600: { color: '#2563eb' },
  textBlue800: { color: '#1e40af' },
  textGreen800: { color: '#166534' },
  textYellow800: { color: '#92400e' },
  
  // Typography
  textXs: { fontSize: 12 },
  textSm: { fontSize: 14 },
  textBase: { fontSize: 16 },
  textLg: { fontSize: 18 },
  textXl: { fontSize: 20 },
  text2Xl: { fontSize: 24 },
  fontMedium: { fontWeight: '500' },
  fontSemibold: { fontWeight: '600' },
  fontBold: { fontWeight: 'bold' },
  textCenter: { textAlign: 'center' },
  
  // Spacing
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 12 },
  p4: { padding: 16 },
  p5: { padding: 20 },
  p6: { padding: 24 },
  px3: { paddingHorizontal: 12 },
  px4: { paddingHorizontal: 16 },
  px5: { paddingHorizontal: 20 },
  py2: { paddingVertical: 8 },
  py3: { paddingVertical: 12 },
  py4: { paddingVertical: 16 },
  m1: { margin: 4 },
  m2: { margin: 8 },
  m4: { margin: 16 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb4: { marginBottom: 16 },
  mr2: { marginRight: 8 },
  ml2: { marginLeft: 8 },
  
  // Borders and Radius
  rounded: { borderRadius: 6 },
  roundedMd: { borderRadius: 8 },
  roundedLg: { borderRadius: 12 },
  roundedFull: { borderRadius: 9999 },
  border: { borderWidth: 1 },
  borderGray200: { borderColor: '#e5e7eb' },
  borderGray400: { borderColor: '#9ca3af' },
  borderBlue500: { borderColor: '#3b82f6' },
  borderGreen400: { borderColor: '#4ade80' },
  
  // Shadows
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Sizing
  w16: { width: 64 },
  h16: { height: 64 },
  minH12: { minHeight: 48 },
});

// Helper function to combine styles
export const combineStyles = (...styles: any[]) => {
  return StyleSheet.flatten(styles.filter(Boolean));
};
