import fs from 'fs';
import path from 'path';

export interface FallbackUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  createdAt: string;
}

const FALLBACK_FILE = path.resolve(process.cwd(), '.fallback_users.json');

function readStore(): Record<string, FallbackUser> {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // ignore read error
  }
  return {};
}

function writeStore(store: Record<string, FallbackUser>) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore write error
  }
}

export const fallbackStore = {
  findByEmail(email: string): FallbackUser | null {
    const store = readStore();
    return store[email.toLowerCase().trim()] || null;
  },

  findByResetToken(token: string): FallbackUser | null {
    const store = readStore();
    for (const u of Object.values(store)) {
      if (u.resetPasswordToken === token) {
        if (u.resetPasswordExpires && new Date(u.resetPasswordExpires) > new Date()) {
          return u;
        }
      }
    }
    return null;
  },

  saveUser(user: Partial<FallbackUser> & { email: string; name: string }): FallbackUser {
    const store = readStore();
    const key = user.email.toLowerCase().trim();
    const existing = store[key] || {
      id: 'usr_' + Date.now().toString(36),
      name: user.name,
      email: key,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    const updated: FallbackUser = {
      ...existing,
      ...user,
      email: key,
    };

    store[key] = updated;
    writeStore(store);
    return updated;
  },

  updatePassword(email: string, hashedPassword: string): boolean {
    const store = readStore();
    const key = email.toLowerCase().trim();
    if (store[key]) {
      store[key].password = hashedPassword;
      delete store[key].resetPasswordToken;
      delete store[key].resetPasswordExpires;
      writeStore(store);
      return true;
    }
    return false;
  },
};

export interface FallbackProduct {
  id: string | number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  imageColor?: string;
  category: string;
  stock: number;
  badge?: string;
  rating?: number;
  reviews?: number;
  status: 'active' | 'out_of_stock' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_PRODUCTS: FallbackProduct[] = [
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

const PRODUCTS_FILE = path.resolve(process.cwd(), '.fallback_products.json');

function readProductStore(): FallbackProduct[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_PRODUCTS;
}

function writeProductStore(products: FallbackProduct[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export const fallbackProductStore = {
  getAll(): FallbackProduct[] {
    return readProductStore();
  },

  getById(id: string | number): FallbackProduct | null {
    const list = readProductStore();
    return list.find((p) => String(p.id) === String(id)) || null;
  },

  save(product: Partial<FallbackProduct> & { title: string; price: number }): FallbackProduct {
    const list = readProductStore();
    const newProduct: FallbackProduct = {
      id: product.id || 'prod_' + Date.now().toString(36),
      title: product.title,
      description: product.description || '',
      price: Number(product.price) || 0,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : 0,
      image: product.image || '/images/products/tshirt.jpg',
      images: product.images || [product.image || '/images/products/tshirt.jpg'],
      category: product.category || 'General',
      stock: product.stock !== undefined ? Number(product.stock) : 50,
      badge: product.badge || '',
      rating: product.rating || 4.9,
      reviews: product.reviews || 10,
      status: product.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(newProduct);
    writeProductStore(list);
    return newProduct;
  },

  update(id: string | number, updates: Partial<FallbackProduct>): FallbackProduct | null {
    const list = readProductStore();
    const index = list.findIndex((p) => String(p.id) === String(id));
    if (index === -1) return null;

    const current = list[index];
    const updated: FallbackProduct = {
      ...current,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : current.price,
      stock: updates.stock !== undefined ? Number(updates.stock) : current.stock,
      originalPrice: updates.originalPrice !== undefined ? Number(updates.originalPrice) : current.originalPrice,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    writeProductStore(list);
    return updated;
  },

  delete(id: string | number): boolean {
    const list = readProductStore();
    const filtered = list.filter((p) => String(p.id) !== String(id));
    if (filtered.length !== list.length) {
      writeProductStore(filtered);
      return true;
    }
    return false;
  },
};

