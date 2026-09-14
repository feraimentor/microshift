import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBExq8biSvTF4n2gbcXeAlXGLkypiWCL4g",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "microshift-81fbb.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "microshift-81fbb",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "microshift-81fbb.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1081965958147",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1081965958147:web:d5780ede1ba7e9a5d42a36",
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const hasFirebaseConfig = Boolean(
  (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey) &&
  (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId)
);
