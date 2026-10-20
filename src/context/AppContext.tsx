"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Product = {
  id: number | string;
  title: string;
  price: number;
  imageColor: string;
};

export type CartItem = Product & { quantity: number };

export type OrderStatus =
  | "Payment Verification Failed"
  | "Order Placed"
  | "Processing"
  | "Printed"
  | "Shipped"
  | "Delivered";

export type PaymentMethod = "UPI" | "Card" | "COD";

export type PaymentStatus =
  | "Pending"
  | "Verification Pending"
  | "Paid"
  | "Failed"
  | "COD Pending"
  | "COD Collected"
  | "Refund Requested"
  | "Refunded";

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  codCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
};

export type User = {
  id?: string;
  name: string;
  email: string;
  photoURL?: string;
  role?: "customer" | "admin";
};

interface BackendOrder {
  orderId?: string;
  _id?: string;
  createdAt?: string;
  items?: CartItem[];
  subtotal: number;
  codCharge?: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
}

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  placeOrder: (paymentMethod: PaymentMethod, transactionId?: string) => Promise<void>;
  adminSettings: {
    codCharge: number;
    minCodOrder: number;
    maxCodOrder: number;
  };
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state lazily from localStorage to satisfy React 19 purity and avoid cascading render warnings
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("cp_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("cp_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("cp_orders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("cp_theme") as "light" | "dark";
      if (saved) return saved;
      const hour = new Date().getHours();
      return hour >= 18 || hour < 6 ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  // Admin settings for COD and checkout rules
  const adminSettings = {
    codCharge: 40,
    minCodOrder: 199,
    maxCodOrder: 5000,
  };

  // Fetch orders from MongoDB backend
  const refreshOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = (await res.json()) as { orders?: BackendOrder[] };
        if (data.orders && Array.isArray(data.orders)) {
          const mappedOrders: Order[] = data.orders.map((o) => ({
            id: o.orderId || o._id || "ORD",
            date: o.createdAt || new Date().toISOString(),
            items: o.items || [],
            subtotal: o.subtotal,
            codCharge: o.codCharge || 0,
            total: o.total,
            status: o.status,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            transactionId: o.transactionId,
          }));
          setOrders(mappedOrders);
        }
      }
    } catch (err) {
      console.warn("Could not load orders from backend:", err);
    }
  }, []);

  // Sync session on mount from server HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    async function checkServerSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              photoURL: data.user.avatar || "",
              role: data.user.role || "customer",
            });
            refreshOrders();
          }
        }
      } catch {
        // server auth endpoint not available yet or network issue
      }
    }

    checkServerSession();

    return () => {
      isMounted = false;
    };
  }, [refreshOrders]);

  // Sync changes to localStorage and DOM for theme
  useEffect(() => {
    if (user) {
      localStorage.setItem("cp_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("cp_user");
    }
    localStorage.setItem("cp_cart", JSON.stringify(cart));
    localStorage.setItem("cp_orders", JSON.stringify(orders));
    localStorage.setItem("cp_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [user, cart, orders, theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const loginWithGoogle = () => {
    if (typeof window !== "undefined") {
      window.location.pathname = "/login";
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    setUser(null);
    setOrders([]);
    localStorage.removeItem("cp_user");
    localStorage.removeItem("cp_orders");
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id));
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const placeOrder = async (paymentMethod: PaymentMethod, transactionId?: string) => {
    if (cart.length === 0) return;

    let codCharge = 0;
    let paymentStatus: PaymentStatus = "Pending";

    if (paymentMethod === "COD") {
      codCharge = adminSettings.codCharge;
      paymentStatus = "COD Pending";
    } else if (paymentMethod === "UPI") {
      paymentStatus = "Verification Pending";
    } else if (paymentMethod === "Card") {
      paymentStatus = "Paid";
    }

    const calculatedTotal = cartTotal + codCharge;

    // Try persisting to MongoDB backend first
    let persistedOrder: Order | null = null;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          subtotal: cartTotal,
          codCharge,
          total: calculatedTotal,
          paymentMethod,
          transactionId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          persistedOrder = {
            id: data.order.orderId || data.order._id,
            date: data.order.createdAt || new Date().toISOString(),
            items: [...cart],
            subtotal: cartTotal,
            codCharge,
            total: calculatedTotal,
            status: data.order.status || "Order Placed",
            paymentMethod,
            paymentStatus,
            transactionId,
          };
        }
      }
    } catch (e) {
      console.warn("Could not save order directly to database, falling back to local:", e);
    }

    // Fallback local order if user is offline or not authenticated yet
    const finalOrder: Order = persistedOrder || {
      id: "ORD-" + Date.now().toString(36).toUpperCase(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: cartTotal,
      codCharge,
      total: calculatedTotal,
      status: "Order Placed",
      paymentMethod,
      paymentStatus,
      transactionId,
    };

    setOrders((prev) => [finalOrder, ...prev]);
    clearCart();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loginWithGoogle,
        logout,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        orders,
        refreshOrders,
        placeOrder,
        adminSettings,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
