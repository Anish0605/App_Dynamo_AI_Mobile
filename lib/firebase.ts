import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcYXrbVi9mW54MMTofbxuyo4lALglkK2M",
  authDomain: "dynamo-ai-01.firebaseapp.com",
  projectId: "dynamo-ai-01",
  storageBucket: "dynamo-ai-01.appspot.com",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const auth = getAuth(app);

export { app, auth };
