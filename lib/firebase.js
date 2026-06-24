import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider, 
  onAuthStateChanged
} from "firebase/auth";
import { getAnalytics, isSupported as analyticsSupported, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if credentials are provided
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId;

let app;
let auth = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
  }
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "Firebase environment variables are missing. Storefront is operating in LOCAL MOCK MODE. " +
      "To connect your real Firebase, create a `.env.local` file with values defined in `.env.example`."
    );
  }
}

// Firebase Analytics — browser-only, and only when a measurementId is configured.
let analytics = null;
if (isFirebaseConfigured && typeof window !== "undefined" && firebaseConfig.measurementId) {
  analyticsSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {});
}

// Helper: log a custom analytics event (safe no-op if analytics isn't ready).
export const trackEvent = (name, params = {}) => {
  if (!analytics) return;
  try {
    logEvent(analytics, name, params);
  } catch (e) {
    console.warn("trackEvent failed:", e?.message || e);
  }
};

// Helper: crash/error reporting on web. Firebase Crashlytics is mobile-only, so
// on the web we log errors as GA4 "exception" events (visible in Firebase
// Analytics → Events). Safe no-op until Analytics is configured.
export const trackException = (error, fatal = false) => {
  if (!analytics) return;
  try {
    const description =
      typeof error === "string"
        ? error
        : error?.stack || error?.message || JSON.stringify(error);
    logEvent(analytics, "exception", {
      description: String(description).slice(0, 500),
      fatal: Boolean(fatal),
    });
  } catch (_) {
    // Never let crash reporting itself throw.
  }
};

// Helper: Custom Email/Password Signup
export const signUp = async (email, password, displayName) => {
  if (!isFirebaseConfigured) {
    // Simulate local signup
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
    if (users.find(u => u.email === email)) {
      throw new Error("auth/email-already-in-use");
    }
    const mockUid = "mock_uid_" + Math.random().toString(36).substr(2, 9);
    const newUser = { uid: mockUid, email, displayName, role: email.toLowerCase() === "admin@jw.com" ? "admin" : "customer" };
    users.push(newUser);
    localStorage.setItem("mock_users", JSON.stringify(users));
    localStorage.setItem("mock_current_user", JSON.stringify(newUser));
    return newUser;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Helper: Custom Email/Password SignIn
export const signIn = async (email, password) => {
  if (!isFirebaseConfigured) {
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
    const user = users.find(u => u.email === email);
    if (!user) {
      throw new Error("auth/user-not-found");
    }
    localStorage.setItem("mock_current_user", JSON.stringify(user));
    return user;
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Helper: Google Sign In
export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    const mockUid = "mock_google_" + Math.random().toString(36).substr(2, 9);
    const mockUser = { uid: mockUid, email: "googleuser@example.com", displayName: "Google Guest", role: "customer" };
    localStorage.setItem("mock_current_user", JSON.stringify(mockUser));
    return mockUser;
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

// Helper: Apple Sign In
export const signInWithApple = async () => {
  if (!isFirebaseConfigured) {
    const mockUid = "mock_apple_" + Math.random().toString(36).substr(2, 9);
    const mockUser = { uid: mockUid, email: "appleuser@example.com", displayName: "Apple Guest", role: "customer" };
    localStorage.setItem("mock_current_user", JSON.stringify(mockUser));
    return mockUser;
  }
  const provider = new OAuthProvider("apple.com");
  // Apple only returns the user's email/name when these scopes are requested,
  // and only on the very first authorization — so always ask for them.
  provider.addScope("email");
  provider.addScope("name");
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

// Helper: Sign Out
export const logout = async () => {
  if (!isFirebaseConfigured) {
    localStorage.removeItem("mock_current_user");
    return;
  }
  await signOut(auth);
};

// Helper: Password Reset
export const resetPassword = async (email) => {
  if (!isFirebaseConfigured) {
    console.log("Mock password reset sent to:", email);
    return;
  }
  await sendPasswordResetEmail(auth, email);
};

export {
  auth,
  analytics,
  isFirebaseConfigured
};
