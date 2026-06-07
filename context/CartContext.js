"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isFirebaseConfigured, db, rtdb } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, set as dbSet } from "firebase/database";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastUid, setLastUid] = useState(null);

  const { currentUser, userProfile } = useAuth();

  // 1. Initial Load from LocalStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedCart = localStorage.getItem("ella_cart");
        const savedWishlist = localStorage.getItem("ella_wishlist");
        if (savedCart) setCart(JSON.parse(savedCart));
        if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to load cart from localStorage:", e);
      }
      setLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // 2. Load cart & wishlist from userProfile on login
  useEffect(() => {
    if (!loaded) return;
    
    if (currentUser) {
      if (currentUser.uid !== lastUid) {
        setLastUid(currentUser.uid);
        if (userProfile) {
          if (Array.isArray(userProfile.cart)) {
            setCart(userProfile.cart);
          }
          if (Array.isArray(userProfile.wishlist)) {
            setWishlist(userProfile.wishlist);
          }
        }
      }
    } else {
      if (lastUid !== null) {
        setLastUid(null);
        setCart([]);
        setWishlist([]);
        // Re-read guest cart from localStorage
        try {
          const savedCart = localStorage.getItem("ella_cart");
          const savedWishlist = localStorage.getItem("ella_wishlist");
          if (savedCart) setCart(savedCart ? JSON.parse(savedCart) : []);
          if (savedWishlist) setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [currentUser, userProfile, loaded, lastUid]);

  // 3. Save to localStorage, Firestore & RTDB on change
  useEffect(() => {
    if (!loaded) return;

    // Save locally
    try {
      localStorage.setItem("ella_cart", JSON.stringify(cart));
      localStorage.setItem("ella_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }

    // If logged in, sync with database
    if (currentUser) {
      const syncDatabase = async () => {
        if (!isFirebaseConfigured) {
          // Sync to mock user database
          const users = JSON.parse(localStorage.getItem("mock_users") || "[]");
          const updatedUsers = users.map(u => u.uid === currentUser.uid ? { ...u, cart, wishlist } : u);
          localStorage.setItem("mock_users", JSON.stringify(updatedUsers));
          
          const currentMock = JSON.parse(localStorage.getItem("mock_current_user"));
          if (currentMock && currentMock.uid === currentUser.uid) {
            localStorage.setItem("mock_current_user", JSON.stringify({ ...currentMock, cart, wishlist }));
          }
          return;
        }

        try {
          // Firestore sync
          const docRef = doc(db, "users", currentUser.uid);
          await updateDoc(docRef, { cart, wishlist });

          // Realtime DB sync (active cart)
          if (rtdb) {
            const cartRef = ref(rtdb, `active_carts/${currentUser.uid}`);
            if (cart.length === 0) {
              await dbSet(cartRef, null); // remove
            } else {
              await dbSet(cartRef, {
                email: currentUser.email,
                displayName: userProfile?.displayName || currentUser.displayName || "Customer",
                itemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
                total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
                items: cart.map(i => ({
                  id: i.product.id,
                  name: i.product.name,
                  quantity: i.quantity,
                  metal: i.selectedMetal || "",
                  size: i.selectedSize || ""
                })),
                updatedAt: new Date().toISOString()
              });
            }
          }
        } catch (e) {
          console.error("Database sync failed:", e);
        }
      };

      syncDatabase();
    }
  }, [cart, wishlist, loaded, currentUser, userProfile]);

  const addToCart = useCallback((product, selectedSize, selectedMetal, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedMetal === selectedMetal
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, { product, selectedSize, selectedMetal, quantity }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId, selectedSize, selectedMetal) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedSize === selectedSize &&
            item.selectedMetal === selectedMetal
          )
      )
    );
  }, []);

  const updateQuantity = useCallback((productId, selectedSize, selectedMetal, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId &&
        item.selectedSize === selectedSize &&
        item.selectedMetal === selectedMetal
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback((productId) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const isInWishlist = useCallback(
    (productId) => wishlist.includes(productId),
    [wishlist]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        cartOpen,
        setCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartCount,
        cartSubtotal,
        loaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
