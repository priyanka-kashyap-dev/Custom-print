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

export type CartItem = Product & {
  quantity: number;
  customDesign?: {
    text?: string;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    uploadedImage?: string;
  };
};

export const DEFAULT_STORE_PRODUCTS: Product[] = [
  {
    id: 1,
    title: "Custom Printed Graphic T-Shirt",
    description: "100% Premium bio-washed cotton with high-definition digital print that never cracks or fades.",
    price: 499,
    originalPrice: 799,
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
    price: 399,
    originalPrice: 599,
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
    price: 549,
    originalPrice: 799,
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
    price: 4999,
    originalPrice: 6999,
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
    price: 699,
    originalPrice: 999,
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
    price: 799,
    originalPrice: 1199,
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
  | "Order Placed"
  | "Payment Confirmed"
  | "Order Processing"
  | "Printing in Progress"
  | "Ready for Dispatch"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Payment Verification Failed"
  | "Payment Failed"
  | "Cancelled"
  | "Processing"
  | "Printed";

export type PaymentMethod = "UPI" | "Card" | "COD";

export type PaymentStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "REFUNDED"
  | "Paid"
  | "Pending"
  | "Verification Pending"
  | "COD Pending"
  | "COD Collected"
  | "Refund Requested";

export type ShippingAddress = {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type Order = {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  customizationCharge?: number;
  deliveryCharge?: number;
  codCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentDate?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  deliveryDistanceKm?: number;
  deliveryDurationText?: string;
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
  customizationCharge?: number;
  deliveryCharge?: number;
  codCharge?: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentDate?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: ShippingAddress;
  deliveryDistanceKm?: number;
  deliveryDurationText?: string;
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
  addToCart: (product: Product, customDesign?: CartItem["customDesign"]) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  cartTotal: number;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  updateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    action?: "refund" | "mark_cod_paid" | "update_status"
  ) => Promise<{ success: boolean; error?: string }>;
  savedAddress: ShippingAddress;
  setSavedAddress: React.Dispatch<React.SetStateAction<ShippingAddress>>;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [savedAddress, setSavedAddress] = useState<ShippingAddress>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem("cp_shipping_address");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
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
            customizationCharge: o.customizationCharge || 0,
            deliveryCharge: o.deliveryCharge || 0,
            codCharge: o.codCharge || 0,
            total: o.total,
            status: o.status,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            transactionId: o.transactionId,
            razorpayOrderId: o.razorpayOrderId,
            razorpayPaymentId: o.razorpayPaymentId,
            paymentDate: o.paymentDate,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            customerPhone: o.customerPhone,
            shippingAddress: o.shippingAddress,
            deliveryDistanceKm: o.deliveryDistanceKm,
            deliveryDurationText: o.deliveryDurationText,
          }));
          setOrders(mappedOrders);
        }
      }
    } catch (err) {
      console.warn("Could not load orders from backend:", err);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      paymentStatus?: PaymentStatus,
      action?: "refund" | "mark_cod_paid" | "update_status"
    ) => {
      try {
        const res = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status, paymentStatus, action }),
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
          } else if (!data.authenticated && isMounted) {
            setUser(null);
            localStorage.removeItem("cp_user");
          }
        }
      } catch {
        // auth endpoint unreachable
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
    localStorage.setItem("cp_shipping_address", JSON.stringify(savedAddress));
    localStorage.setItem("cp_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [user, cart, orders, savedAddress, theme]);

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

  const addToCart = (product: Product, customDesign?: CartItem["customDesign"]) => {
    setCart((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id));
      if (existing) {
        return prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + 1, ...(customDesign && { customDesign }) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, ...(customDesign && { customDesign }) }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

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
        savedAddress,
        setSavedAddress,
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
