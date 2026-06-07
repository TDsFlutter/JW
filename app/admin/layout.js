"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const { currentUser, userProfile, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push("/login?redirect=/admin");
      } else if (!isAdmin) {
        // Redirect standard customers to home or profile page
        router.push("/profile");
      }
    }
  }, [currentUser, isAdmin, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#faf9f6",
        fontFamily: "var(--font-lato), sans-serif",
        color: "#707070",
        fontStyle: "italic"
      }}>
        Verifying Administrator Access...
      </div>
    );
  }

  // Only render children if user is logged in AND is admin
  if (!currentUser || !isAdmin) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#faf9f6",
        fontFamily: "var(--font-lato), sans-serif",
        color: "#c0392b"
      }}>
        Unauthorized Access. Redirecting...
      </div>
    );
  }

  return <>{children}</>;
}
