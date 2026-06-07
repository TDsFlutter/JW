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
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  limit
} from "firebase/firestore";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Check if credentials are provided
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId;

let app;
let auth = null;
let db = null;
let rtdb = null;
let storage = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    if (firebaseConfig.databaseURL) {
      rtdb = getDatabase(app);
    }
    storage = getStorage(app);
  } catch (error) {
    console.error("Error initializing Firebase services:", error);
  }
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "Firebase environment variables are missing. Storefront is operating in LOCAL MOCK MODE. " +
      "To connect your real Firebase, create a `.env.local` file with values defined in `.env.example`."
    );
  }
}

// Helper: Custom Email/Password Signup
export const signUp = async (email, password, displayName) => {
  if (!isFirebaseConfigured) {
    // Simulate local signup
    const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
    if (users.find(u => u.email === email)) {
      throw new Error("auth/email-already-in-use");
    }
    const mockUid = "mock_uid_" + Math.random().toString(36).substr(2, 9);
    const newUser = { uid: mockUid, email, displayName, role: email.includes("admin") ? "admin" : "customer" };
    users.push(newUser);
    localStorage.setItem("mock_users", JSON.stringify(users));
    localStorage.setItem("mock_current_user", JSON.stringify(newUser));
    return newUser;
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Set initial customer profile in Firestore
  const role = (email.toLowerCase().includes("admin") || email === "trunaldungarani15@gmail.com") ? "admin" : "customer";
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.displayName || email.split("@")[0],
    role: role,
    createdAt: new Date().toISOString(),
    address: "",
    phone: "",
    wishlist: []
  });
  
  return user;
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
  const user = result.user;
  
  // Check if profile exists, if not create
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Google User",
      role: "customer",
      createdAt: new Date().toISOString(),
      address: "",
      phone: "",
      wishlist: []
    });
  }
  return user;
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
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Apple User",
      role: "customer",
      createdAt: new Date().toISOString(),
      address: "",
      phone: "",
      wishlist: []
    });
  }
  return user;
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

  // Build the continue URL so the reset link redirects back to our login page
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const continueUrl = `${origin}${basePath}/login`;

  const actionCodeSettings = {
    url: continueUrl,
    handleCodeInApp: false,
  };

  await sendPasswordResetEmail(auth, email, actionCodeSettings);
};

export { 
  auth, 
  db, 
  rtdb, 
  storage, 
  isFirebaseConfigured,
  // Database re-exports for easy consumption
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  limit,
  ref,
  set as dbSet,
  get as dbGet,
  update as dbUpdate,
  onValue
};
