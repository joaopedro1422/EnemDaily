import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyCT15dU5egZZGT0RH1gdVr7QhAJ3avdsAA",
  authDomain: "enemdaily.firebaseapp.com",
  projectId: "enemdaily",
  storageBucket: "enemdaily.firebasestorage.app",
  messagingSenderId: "671910350341",
  appId: "1:671910350341:web:d1b52e01b307f3a73ad66c",
  measurementId: "G-61FG72D7VB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);