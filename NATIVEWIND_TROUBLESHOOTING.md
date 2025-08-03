# NativeWind Troubleshooting Guide

## Common Issues and Solutions

### 1. Styles Not Applying
- **Issue**: Tailwind classes not being applied to React Native components
- **Solution**: 
  - Ensure NativeWind babel plugin is properly configured
  - Clear Metro cache: `npx expo r -c`
  - Verify content paths in tailwind.config.js include all relevant files

### 2. App Layout Appears "Crooked"
- **Issue**: Layout looks broken or misaligned
- **Potential Causes**:
  - Missing flex-1 on root containers
  - Incorrect flex direction or justification
  - SafeAreaView not properly configured
  - Platform-specific styling conflicts

### 3. NativeWind v2 Specific Issues
- **Babel Configuration**: Use `"nativewind/babel"` without additional options
- **Metro Configuration**: Don't use `withNativeWind` wrapper (that's for v4+)
- **CSS Import**: Remove `import './global.css'` from App.tsx (doesn't work in RN)

### 4. Typography Issues
- **Issue**: Fonts not displaying correctly
- **Solution**: Use React Native safe font families or load custom fonts

### 5. Color and Background Issues
- **Issue**: Colors not showing up
- **Solution**: Ensure proper contrast and valid Tailwind color names

## Configuration Checklist

✅ babel.config.js has "nativewind/babel" plugin
✅ tailwind.config.js content paths include all source files
✅ nativewind-env.d.ts is included in tsconfig.json
✅ No CSS imports in App.tsx
✅ NativeWind v2.0.0 installed
✅ Metro cache cleared after configuration changes

## Test Steps

1. Launch the app with NativeWind test component
2. Verify all styling categories work:
   - Layout (flex, positioning)
   - Colors and backgrounds
   - Typography
   - Spacing and padding
   - Buttons and interactions
   - Flex and alignment

3. If any category fails, check the specific configuration for that feature.
