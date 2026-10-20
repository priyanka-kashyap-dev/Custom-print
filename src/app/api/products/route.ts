import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';

const INITIAL_PRODUCTS = [
  {
    title: 'Custom Printed Shirts',
    description: 'Premium cotton t-shirts with your unique design or photo.',
    price: 25,
    imageColor: '#fdfbfb',
    category: 'Apparel',
    stock: 150,
    status: 'active',
  },
  {
    title: 'Personalized Pillows',
    description: 'Cozy up with memories. Soft cushions featuring your photos.',
    price: 30,
    imageColor: '#f7f0f6',
    category: 'Home & Living',
    stock: 80,
    status: 'active',
  },
  {
    title: 'Heart-Shaped Pillows',
    description: 'The perfect romantic gift for your loved one.',
    price: 35,
    imageColor: '#fae8e8',
    category: 'Gifts',
    stock: 60,
    status: 'active',
  },
  {
    title: 'Custom Printed Couches',
    description: 'Unique printed couches to bring your living room to life.',
    price: 299,
    imageColor: '#f0f4f8',
    category: 'Furniture',
    stock: 15,
    status: 'active',
  },
  {
    title: 'Couple Gifts',
    description: 'Matching sets and personalized gifts for couples.',
    price: 40,
    imageColor: '#fdf8ec',
    category: 'Gifts',
    stock: 100,
    status: 'active',
  },
  {
    title: 'Custom Designs',
    description: "Have an idea? We'll help you bring it to life on any product.",
    price: 50,
    imageColor: '#f3f0f7',
    category: 'Custom',
    stock: 999,
    status: 'active',
  },
];

interface CreateProductBody {
  title?: string;
  description?: string;
  price?: number;
  imageColor?: string;
  category?: string;
  stock?: number;
  status?: 'active' | 'out_of_stock' | 'draft';
}

/**
 * GET /api/products
 * Public endpoint to fetch catalog products. Automatically initializes catalog on first load.
 */
export async function GET() {
  try {
    await connectToDatabase();

    let products = await Product.find({ status: 'active' }).sort({ createdAt: 1 }).lean();

    // Auto-seed default catalog if collection is empty
    if (products.length === 0) {
      await Product.insertMany(INITIAL_PRODUCTS);
      products = await Product.find({ status: 'active' }).sort({ createdAt: 1 }).lean();
    }

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error';
    console.error('Error fetching products:', error);
    // Fallback gracefully to memory products if database is not yet connected
    return NextResponse.json({
      success: false,
      fallback: true,
      error: message,
      products: INITIAL_PRODUCTS.map((p, idx) => ({ ...p, id: idx + 1 })),
    });
  }
}

/**
 * POST /api/products
 * Admin-only endpoint to add a new product.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Role-based access control (RBAC): Only verified admins can create products
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required to create products.' },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as CreateProductBody;
    const { title, description, price, imageColor, category, stock, status } = body;

    if (!title || price === undefined) {
      return NextResponse.json(
        { error: 'Title and price are required fields.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const product = await Product.create({
      title,
      description: description || '',
      price: Number(price),
      imageColor: imageColor || '#f3f4f6',
      category: category || 'General',
      stock: stock !== undefined ? Number(stock) : 100,
      status: status || 'active',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        product,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
