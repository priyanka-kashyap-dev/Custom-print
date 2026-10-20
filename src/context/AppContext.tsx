"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { isAdminEmail } from "@/lib/auth-constants";

export type Product = {
  id: number | string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  images?: string[];
  imageColor?: string;
  category?: string;
  stock?: number;
  badge?: string;
  rating?: number;
  reviews?: number;
  status?: "active" | "out_of_stock" | "draft";
};

export type CartItem = Product & { quantity: number };

export const DEFAULT_STORE_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Custom Printed Graphic T-Shirt",
    description: "100% Premium bio-washed cotton with high-definition digital print that never cracks or fades.",
    price: 25,
    originalPrice: 35,
    stock: 45,
    category: "Apparel",
    badge: "Bestseller",
    status: "active",
    rating: 4.9,
    reviews: 142,
    image: "/images/products/tshirt.jpg",
    images: ["/images/products/tshirt.jpg"],
    imageColor: "#fdfbfb",
  },
  {
    id: 2,
    title: "Personalized Linen Photo Cushion",
    description: "Soft, breathable premium linen fabric with custom portrait printing and fluffy microfiber insert.",
    price: 30,
    originalPrice: 40,
    stock: 32,
    category: "Home Decor",
    badge: "Trending",
    status: "active",
    rating: 4.8,
    reviews: 98,
    image: "/images/products/pillow.jpg",
    images: ["/images/products/pillow.jpg"],
    imageColor: "#f7f0f6",
  },
  {
    id: 3,
    title: "Luxury Velvet Heart Pillow",
    description: "Romantic plush velvet heart cushion with gold metallic embroidery & customized names.",
    price: 35,
    originalPrice: 48,
    stock: 18,
    category: "Gifts",
    badge: "Most Loved",
    status: "active",
    rating: 5.0,
    reviews: 210,
    image: "/images/products/heart-pillow.jpg",
    images: ["/images/products/heart-pillow.jpg"],
    imageColor: "#fae8e8",
  },
  {
    id: 4,
    title: "Designer Custom Printed Accent Couch",
    description: "Statement living room designer chair with personalized artist fabric and solid wood frame.",
    price: 299,
    originalPrice: 399,
    stock: 8,
    category: "Furniture",
    badge: "Luxury",
    status: "active",
    rating: 4.9,
    reviews: 47,
    image: "/images/products/couch.jpg",
    images: ["/images/products/couch.jpg"],
    imageColor: "#f0f4f8",
  },
  {
    id: 5,
    title: "Couple Gift Set (Mugs & Portrait Frame)",
    description: "Matching custom ceramic couple mugs paired with an elegant gold-framed memorial portrait.",
    price: 40,
    originalPrice: 55,
    stock: 25,
    category: "Gifts",
    badge: "Special Set",
    status: "active",
    rating: 4.9,
    reviews: 184,
    image: "/images/products/couple-gift.jpg",
    images: ["/images/products/couple-gift.jpg"],
    imageColor: "#fdf8ec",
  },
  {
    id: 6,
    title: "Gallery Custom Canvas Art Print",
    description: "Museum-grade stretched canvas with vibrant UV-resistant pigment inks, ready to hang.",
    price: 50,
    originalPrice: 70,
    stock: 50,
    category: "Wall Decor",
    badge: "Popular",
    status: "active",
    rating: 4.9,
    reviews: 89,
    image: "/images/products/canvas.jpg",
    images: ["/images/products/canvas.jpg"],
    imageColor: "#f3f0f7",
  },
];

export type OrderStatus =
  | "Payment Verification Failed"
  | "Order Placed"
  | "Processing"
  | "Printed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

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

export type ShippingAddress = {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

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
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: ShippingAddress;
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
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: ShippingAddress;
}

interface AppContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAdmin: boolean;
  products: Product[];
  refreshProducts: () => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ) => Promise<{ success: boolean; error?: string }>;
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

  const [products, setProducts] = useState<Product[]>(DEFAULT_STORE_PRODUCTS);

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

  const isAdmin = Boolean(
    user && (user.role === "admin" || isAdminEmail(user.email))
  );

  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch (err) {
      console.warn("Could not fetch latest products:", err);
    }
  }, []);

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
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            shippingAddress: o.shippingAddress,
          }));
          setOrders(mappedOrders);
        }
      }
    } catch (err) {
      console.warn("Could not load orders from backend:", err);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => {
      try {
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status, paymentStatus }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || "Failed to update order status" };
        }
        await refreshOrders();
        return { success: true };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Network error occurred",
        };
      }
    },
    [refreshOrders]
  );

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
    refreshProducts();

    return () => {
      isMounted = false;
    };
  }, [refreshOrders, refreshProducts]);

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
        isAdmin,
        products,
        refreshProducts,
        loginWithGoogle,
        logout,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        orders,
        refreshOrders,
        updateOrderStatus,
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
