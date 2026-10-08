"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Product = {
  id: number;
  title: string;
  price: number;
  imageColor: string;
};

export type CartItem = Product & { quantity: number };

export type OrderStatus = "Payment Verification Failed" | "Order Placed" | "Processing" | "Printed" | "Shipped" | "Delivered";

export type PaymentMethod = "UPI" | "Card" | "COD";

export type PaymentStatus = "Pending" | "Verification Pending" | "Paid" | "Failed" | "COD Pending" | "COD Collected" | "Refund Requested" | "Refunded";

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
  name: string;
  email: string;
  photoURL?: string;
  role?: "customer" | "admin";
};

interface AppContextType {
  user: User | null;
  loginWithGoogle: () => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  placeOrder: (paymentMethod: PaymentMethod, transactionId?: string) => void;
  adminSettings: {
    codCharge: number;
    minCodOrder: number;
    maxCodOrder: number;
  };
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Mock Admin Settings
  const adminSettings = {
    codCharge: 40,
    minCodOrder: 199,
    maxCodOrder: 5000,
  };

  useEffect(() => {
    // Load from local storage on mount
    const savedUser = localStorage.getItem("cp_user");
    const savedCart = localStorage.getItem("cp_cart");
    const savedOrders = localStorage.getItem("cp_orders");
    const savedTheme = localStorage.getItem("cp_theme") as 'light' | 'dark';

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Auto-detect based on local time
      const hour = new Date().getHours();
      const isNight = hour >= 18 || hour < 6;
      const initialTheme = isNight ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  useEffect(() => {
    // Save to local storage on change
    localStorage.setItem("cp_user", JSON.stringify(user));
    localStorage.setItem("cp_cart", JSON.stringify(cart));
    localStorage.setItem("cp_orders", JSON.stringify(orders));
    localStorage.setItem("cp_theme", theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [user, cart, orders, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const loginWithGoogle = () => {
    // Mock Google Login for prototype demonstration
    const mockUser: User = {
      name: "Awesome Customer",
      email: "customer@gmail.com",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      role: "customer"
    };
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const placeOrder = (paymentMethod: PaymentMethod, transactionId?: string) => {
    if (cart.length === 0) return;

    let codCharge = 0;
    let paymentStatus: PaymentStatus = "Pending";

    if (paymentMethod === "COD") {
      codCharge = adminSettings.codCharge;
      paymentStatus = "COD Pending";
    } else if (paymentMethod === "UPI") {
      paymentStatus = "Verification Pending";
    } else if (paymentMethod === "Card") {
      paymentStatus = "Paid"; // Simulated successful card payment
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: new Date().toISOString(),
      items: [...cart],
      subtotal: cartTotal,
      codCharge: codCharge,
      total: cartTotal + codCharge,
      status: "Order Placed", // initial status
      paymentMethod,
      paymentStatus,
      transactionId: transactionId || (paymentMethod === "Card" ? `TXN${Math.floor(Math.random()*1000000)}` : undefined)
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // Simulate order processing timeline for demonstration
    setTimeout(() => updateOrderStatus(newOrder.id, "Processing"), 10000); // 10 seconds later
    setTimeout(() => updateOrderStatus(newOrder.id, "Printed"), 25000); // 25 seconds later
    setTimeout(() => updateOrderStatus(newOrder.id, "Shipped"), 40000); // 40 seconds later
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loginWithGoogle,
        logout,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        orders,
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
