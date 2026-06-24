"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  signIn,
  signUp,
  resetPassword,
  isFirebaseConfigured
} from "@/lib/firebase";
import styles from "./login.module.css";

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || "http://localhost:3000";

export default function AdminLoginPage() {
  const [activeTab, setActiveTab] = useState("signin"); // signin, forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { currentUser, isAdmin, notifyMockAuthChange } = useAuth();
  const router = useRouter();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (currentUser && isAdmin) {
      router.push("/");
    } else if (currentUser && !isAdmin) {
      setError("This account does not have administrator privileges. Please log in with an admin account.");
    }
  }, [currentUser, isAdmin, router]);

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
      setSuccess("Verifying administrator access...");
      if (!isFirebaseConfigured) {
        notifyMockAuthChange();
      }
      // The useEffect above will handle redirect once auth state updates
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

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <div className={styles.adminBadge}>ADMIN PANEL</div>
        <h1 className={styles.title}>ORNIVAJEWELS</h1>
        <p className={styles.subtitle}>Administrator Control Panel Access</p>

        {!isFirebaseConfigured && (
          <div className={styles.fallbackNotice}>
            <strong>Local Mock Mode Active</strong><br />
            Tip: Use <code>admin@ella.com</code> to simulate Admin access. Any password works!
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {activeTab === "signin" && (
          <form onSubmit={handleSignIn} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Admin Email</label>
              <input 
                id="email"
                type="email" 
                className={styles.input} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email"
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
              {loading ? "Authenticating..." : "Sign In to Admin"}
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

        <div className={styles.backToSite}>
          <a href={MAIN_SITE_URL}>← Back to Main Website</a>
        </div>
      </div>
    </div>
  );
}
