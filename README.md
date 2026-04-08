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
- [pnpm](https://pnpm.io) or npm
- [Expo Go](https://expo.dev/client) app on your phone (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/Anish0605/App_Dynamo_AI_Mobile.git
cd App_Dynamo_AI_Mobile

# Install dependencies
npm install
# or
pnpm install
```

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
├── contexts/               # React Context providers (Auth)
├── lib/
│   ├── api.ts              # API client (talks to app.dynamoai.in)
│   ├── firebase.ts         # Firebase config
│   └── conversations.ts    # Local conversation storage
├── constants/              # Theme colors
├── hooks/                  # Custom hooks
├── assets/                 # Images and icons
└── app.json                # Expo configuration
```

---

## Configuration

The app connects to the Dynamo AI backend at `https://app.dynamoai.in` (configured in `lib/api.ts`).

Firebase authentication is configured in `lib/firebase.ts`.

For Android, a `google-services.json` file is required (already included for this project's Firebase instance).

---

## Related

- **Web App:** [github.com/Anish0605/App_Dynamo_AI](https://github.com/Anish0605/App_Dynamo_AI)

---

## License

Private — All rights reserved. Dynamo AI.
