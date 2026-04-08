# Dynamo AI — Mobile App

The official **Dynamo AI** mobile application, built with [Expo](https://expo.dev) and React Native. Dynamo AI is an advanced AI assistant with real-time streaming chat, voice input, file analysis, AI memory, and subscription management.

**Web app:** [app.dynamoai.in](https://app.dynamoai.in)

---

## Features

- **AI Chat** — Real-time streaming responses powered by the Dynamo AI backend
- **Voice Input** — Speak your questions using built-in voice-to-text
- **File & Image Analysis** — Upload documents and images for AI analysis
- **Chat History** — Searchable list of past conversations (stored locally)
- **AI Memory** — Save facts you want the AI to remember across sessions
- **Web Search** — Toggle web search for up-to-date answers
- **DeepThink Mode** — Extended reasoning for complex questions
- **Subscription Plans** — Free, Plus (₹199/mo), Pro (₹499/mo) via Razorpay
- **Export Chats** — Download conversations as PDF, Word, or PPT

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) (SDK 54) + React Native |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based) |
| Auth | Firebase Authentication + Google OAuth |
| Payments | Razorpay |
| State | React Context + TanStack Query |
| Language | TypeScript |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or [pnpm](https://pnpm.io)
- [Expo Go](https://expo.dev/client) app on your phone (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/Anish0605/App_Dynamo_AI_Mobile.git
cd App_Dynamo_AI_Mobile

# Install dependencies
npm install
```

### Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set your Firebase project credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
```

You can find these values in the [Firebase Console](https://console.firebase.google.com) under:
**Project Settings → General → Your apps → Web app → SDK setup and configuration**

#### Android (google-services.json)

For Android builds, you also need a `google-services.json` file:

1. Go to [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps
2. Download the `google-services.json` for your Android app
3. Place it in the project root directory

A template is provided at `google-services.json.example`.

### Running the App

```bash
# Start the development server
npx expo start
```

Then scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

---

## Project Structure

```
├── app/                    # File-based routing (expo-router)
│   ├── index.tsx           # Splash / landing screen
│   ├── login.tsx           # Login screen
│   ├── signup.tsx          # Sign up screen
│   ├── memory.tsx          # AI Memory management
│   ├── pricing.tsx         # Subscription plans
│   ├── chat/[id].tsx       # Active chat screen
│   └── (tabs)/
│       ├── index.tsx       # Home / new chat
│       ├── chats.tsx       # Chat history
│       └── profile.tsx     # User profile & credits
├── components/             # Shared UI components
│   ├── LightningLogo.tsx   # Dynamo AI brand logo
│   └── ToolsSheet.tsx      # Chat tools bottom sheet
├── contexts/               # React Context providers
│   └── AuthContext.tsx     # Firebase auth state
├── lib/
│   ├── api.ts              # API client (Dynamo AI backend)
│   ├── firebase.ts         # Firebase initialization
│   └── conversations.ts    # Local conversation storage
├── constants/              # Theme colors
├── hooks/                  # Custom hooks
├── assets/                 # Images and icons
├── .env.example            # Environment variable template
└── app.json                # Expo configuration
```

---

## Configuration

The app connects to the Dynamo AI backend at `https://app.dynamoai.in`. This is configured in `lib/api.ts`.

Firebase authentication is initialized in `lib/firebase.ts` using the `EXPO_PUBLIC_FIREBASE_*` environment variables defined in your `.env` file.

> **Note:** Firebase web API keys (`EXPO_PUBLIC_*`) are designed to be client-side public values. Security for your Firebase data is enforced through [Firebase Security Rules](https://firebase.google.com/docs/rules) in the Firebase Console — not by keeping the API key secret.

---

## Related

- **Web App:** [github.com/Anish0605/App_Dynamo_AI](https://github.com/Anish0605/App_Dynamo_AI)

---

## License

Copyright © 2025 Dynamo AI. All rights reserved.
