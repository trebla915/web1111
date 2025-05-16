# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start the development server
npm start
# or
npx expo start

# Platform-specific development
npm run android   # Run on Android
npm run ios       # Run on iOS
npm run web       # Run on Web

# Linting
npm run lint      # Run Expo lint

# Testing
npm test          # Run Jest tests in watch mode

# Build production apps
npm run build:ios       # Build for iOS
npm run build:android   # Build for Android
npm run build:all       # Build for both platforms

# Submit to app stores
npm run submit:ios      # Submit iOS build 
npm run submit:android  # Submit Android build
npm run submit:all      # Submit both platforms

# Development builds
npm run dev:ios         # Create and run iOS development build
npm run dev:android     # Create and run Android development build
```

## Project Architecture

This is an Expo React Native application with the following key architectural components:

### 1. Navigation & Routing

The application uses Expo Router with file-based routing:
- `app/_layout.tsx`: Root layout with authentication flow and providers
- `app/(tabs)/_layout.tsx`: Tab navigator for authenticated users
- `app/(auth)/_layout.tsx`: Authentication screens for login/register
- `app/(admin)/_layout.tsx`: Admin-only screens for management
- `app/(reservations)/_layout.tsx`: Flow for table reservations

### 2. Authentication

- Firebase Authentication with email/password
- `src/contexts/AuthContext.tsx`: Manages auth state, token handling, and persistence
- Auth states: signed-in, signed-out, loading, guest mode
- Token refresh mechanism for API authorization

### 3. State Management

React Context-based state management with multiple domain-specific providers:
- `src/contexts/AuthContext.tsx`: Authentication state
- `src/contexts/UserContext.tsx`: User profile and preferences
- `src/contexts/LoadingContext.tsx`: Loading states
- `src/contexts/NotificationContext.tsx`: Push notifications
- `src/contexts/BottleContext.tsx`: Bottle catalog and selection

### 4. API & Backend Integration

- `src/utils/api.ts`: Centralized Axios client with auth token interceptors
- `src/config/firebase.ts`: Firebase configuration and service initialization
- Environment variables: Uses `react-native-dotenv` via `@env` import syntax

### 5. Payment Processing

- Stripe integration via `@stripe/stripe-react-native`
- `src/hooks/useStripePayment.ts`: Custom hook for payment flow
- `src/utils/paymentUtils.ts`: Payment intent creation, cost calculation

### 6. Key Features

- **Table Reservations**: Selection, bottle requirements, payment
- **Events Management**: Upcoming events, admin event creation
- **User Management**: Admin panel for user roles and permissions
- **Bottle Service**: Catalog, selection, and requirements
- **Push Notifications**: Using Expo Notifications

## Environment Setup

The app uses environment variables for configuration:
- Firebase credentials
- API base URL
- Stripe publishable key

Environment setup is handled via scripts:
- `npm run setup:env`: Configures environment variables
- `npm run prebuild`: Pre-build preparation

## Styling Approach

- Native styling with StyleSheet
- Dark theme with consistent color palette
- `src/constants/Colors.ts`: Color definitions
- `src/hooks/useThemeColor.ts`: Theme-aware component styling

## Firebase Integration

Firebase services used:
- Authentication
- Firestore (database)
- Storage (for images)
- Analytics (when supported)

## Important Notes

1. Always refresh auth tokens when performing authenticated operations
2. Check bottle minimums during reservation process
3. Handle Stripe payment errors gracefully
4. Verify user roles for accessing admin functions