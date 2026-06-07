"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  doc, 
  getDoc, 
  updateDoc 
} from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user profile from Firestore or LocalStorage
  const refreshProfile = async (uid, mockUser = null) => {
    if (!isFirebaseConfigured) {
      if (mockUser) {
        setUserProfile(mockUser);
      } else {
        const localUser = JSON.parse(localStorage.getItem("mock_current_user"));
        setUserProfile(localUser);
      }
      return;
    }

    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile({
          uid,
          email: currentUser?.email || "",
          displayName: currentUser?.displayName || "Guest User",
          role: "customer",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Load mock current user session
      const mockUser = JSON.parse(localStorage.getItem("mock_current_user"));
      if (mockUser) {
        setCurrentUser(mockUser);
        setUserProfile(mockUser);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
      
      // Custom event listener for local login/logout sync
      const handleMockAuth = () => {
        const user = JSON.parse(localStorage.getItem("mock_current_user"));
        if (user) {
          setCurrentUser(user);
          setUserProfile(user);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      };
      window.addEventListener("mock-auth-change", handleMockAuth);
      return () => window.removeEventListener("mock-auth-change", handleMockAuth);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await refreshProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateProfileData = async (data) => {
    if (!currentUser) return;
    
    if (!isFirebaseConfigured) {
      const updated = { ...userProfile, ...data };
      setUserProfile(updated);
      localStorage.setItem("mock_current_user", JSON.stringify(updated));
      
      // Update in mock_users array
      const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
      const updatedUsers = users.map(u => u.uid === currentUser.uid ? { ...u, ...data } : u);
      localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
      return;
    }

    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, data);
      await refreshProfile(currentUser.uid);
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const notifyMockAuthChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("mock-auth-change"));
    }
  };

  const value = {
    currentUser,
    userProfile,
    isAdmin: 
      userProfile?.role === "admin" || 
      (userProfile?.email && userProfile.email.toLowerCase().includes("admin")) ||
      (currentUser?.email === "trunaldungarani15@gmail.com") ||
      (currentUser?.uid === "tROlBri6nOaFyLMT8nW6gateWB12"),
    loading,
    refreshProfile,
    updateProfileData,
    notifyMockAuthChange
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
