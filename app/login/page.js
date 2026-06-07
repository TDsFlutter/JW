"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  signIn, 
  signUp, 
  signInWithGoogle, 
  signInWithApple, 
  resetPassword, 
  isFirebaseConfigured 
} from "@/lib/firebase";
import styles from "./login.module.css";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("signin"); // signin, signup, forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { currentUser, notifyMockAuthChange } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/profile";

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.push(redirect);
    }
  }, [currentUser, redirect, router]);

  const handleError = (err) => {
    console.error("Auth error:", err);
    if (err.message === "auth/email-already-in-use" || err.code === "auth/email-already-in-use") {
      setError("This email address is already in use by another account.");
    } else if (err.message === "auth/user-not-found" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
      setError("Invalid email or password. Please try again.");
    } else if (err.code === "auth/invalid-credential") {
      setError("Incorrect credentials. Please check and try again.");
    } else {
      setError(err.message || "An authentication error occurred. Please try again.");
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await signIn(email, password);
      setSuccess("Logged in successfully!");
      if (!isFirebaseConfigured) {
        notifyMockAuthChange();
      }
      setTimeout(() => router.push(redirect), 1000);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      setSuccess("Account created successfully!");
      if (!isFirebaseConfigured) {
        notifyMockAuthChange();
      }
      setTimeout(() => router.push(redirect), 1000);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess("Password reset instructions have been sent to your email.");
      setTimeout(() => setActiveTab("signin"), 3000);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (providerName) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (providerName === "google") {
        await signInWithGoogle();
      } else if (providerName === "apple") {
        await signInWithApple();
      }
      setSuccess("Signed in successfully!");
      if (!isFirebaseConfigured) {
        notifyMockAuthChange();
      }
      setTimeout(() => router.push(redirect), 1000);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>ëlla jewelry</h1>
        <p className={styles.subtitle}>Premium Craftsmanship & Timeless Design</p>

        {!isFirebaseConfigured && (
          <div className={styles.fallbackNotice}>
            <strong>Local Mock Mode Active</strong><br />
            Tip: Use <code>admin@ella.com</code> to simulate Admin access or <code>customer@ella.com</code> for a regular buyer. Any password works!
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {activeTab !== "forgot" && (
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === "signin" ? styles.activeTab : ""}`}
              onClick={() => { setActiveTab("signin"); setError(""); setSuccess(""); }}
            >
              Sign In
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === "signup" ? styles.activeTab : ""}`}
              onClick={() => { setActiveTab("signup"); setError(""); setSuccess(""); }}
            >
              Register
            </button>
          </div>
        )}

        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input 
                id="email"
                type="email" 
                className={styles.input} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input 
                id="password"
                type="password" 
                className={styles.input} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button 
              type="button" 
              className={styles.forgotBtn}
              onClick={() => { setActiveTab("forgot"); setError(""); setSuccess(""); }}
            >
              Forgot Password?
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        )}

        {activeTab === "signup" && (
          <form onSubmit={handleSignUp} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Full Name</label>
              <input 
                id="name"
                type="text" 
                className={styles.input} 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input 
                id="email"
                type="email" 
                className={styles.input} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password (min. 6 chars)</label>
              <input 
                id="password"
                type="password" 
                className={styles.input} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>
        )}

        {activeTab === "forgot" && (
          <form onSubmit={handleForgotPassword} className={styles.form}>
            <h2 className={styles.label} style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '10px' }}>
              Reset Your Password
            </h2>
            <p className={styles.subtitle} style={{ marginBottom: '15px' }}>
              We will send you instructions to reset your password.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input 
                id="email"
                type="email" 
                className={styles.input} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button 
              type="button" 
              className={styles.forgotBtn} 
              style={{ alignSelf: 'center', marginTop: '10px' }}
              onClick={() => { setActiveTab("signin"); setError(""); setSuccess(""); }}
            >
              Back to Login
            </button>
          </form>
        )}

        <div className={styles.divider}>Or Continue With</div>

        <div className={styles.socialGrid}>
          <button 
            type="button" 
            className={styles.socialBtn}
            onClick={() => handleSocialSignIn("google")}
            disabled={loading}
          >
            <svg className={styles.socialIcon} viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 1.84 14.96 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99C6.19 7.02 8.87 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.25-2.07 3.59-5.12 3.59-8.66z"/>
              <path fill="#FBBC05" d="M5.24 14.55a6.96 6.96 0 0 1 0-4.24L1.39 7.32a11.967 11.967 0 0 0 0 9.35l3.85-2.99a6.96 6.96 0 0 1 0-1.13z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.1.74-2.5 1.18-4.12 1.18-3.13 0-5.81-1.98-6.76-4.96L1.39 16.32C3.37 20.33 7.35 23 12 23z"/>
            </svg>
            Google
          </button>
          <button 
            type="button" 
            className={styles.socialBtn}
            onClick={() => handleSocialSignIn("apple")}
            disabled={loading}
          >
            <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="#000000">
              <path d="M18.71,19.5 C17.88,20.74 17,21.95 15.66,21.97 C14.32,22 13.89,21.18 12.37,21.18 C10.84,21.18 10.37,21.95 9.1,22 C7.79,22.05 6.8,20.68 5.96,19.47 C4.25,17 2.94,12.45 4.7,9.39 C5.57,7.87 7.13,6.91 8.82,6.88 C10.1,6.86 11.32,7.75 12.11,7.75 C12.89,7.75 14.37,6.68 15.92,6.84 C16.57,6.87 18.39,7.1 19.56,8.82 C19.47,8.88 17.39,10.1 17.41,12.63 C17.44,15.65 20.06,16.66 20.1,16.67 C20.08,16.74 19.67,18.11 18.71,19.5 M15.97,4.17 C16.63,3.37 17.07,2.28 16.95,1 C16,1.04 14.9,1.6 14.24,2.38 C13.68,3.04 13.19,4.14 13.34,5.39 C14.39,5.47 15.4,4.88 15.97,4.17 Z"/>
            </svg>
            Apple
          </button>
        </div>
      </div>
    </div>
  );
}
