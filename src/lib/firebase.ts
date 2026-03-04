import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let auth: Auth | undefined;

// Basic validation to ensure the API key is not a placeholder or empty
const isApiKeyValid = 
  firebaseConfig.apiKey && 
  typeof firebaseConfig.apiKey === "string" && 
  firebaseConfig.apiKey.length > 20 && 
  !firebaseConfig.apiKey.includes("YOUR_API_KEY");

if (isApiKeyValid) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.warn("Firebase API key is missing or invalid. Authentication will be disabled.");
}

export { auth };
