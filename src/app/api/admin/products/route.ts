import { NextResponse } from 'next/server';
import { getSessionUser, isAdminEmail } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { fallbackProductStore, FallbackProduct } from '@/lib/fallback-store';

function resolveImage(title: string, currentImage?: string): string {
  if (currentImage && currentImage.trim() !== '') {
    return currentImage;
  }
  const lower = title.toLowerCase();
  if (lower.includes('heart')) return '/images/products/heart-pillow.jpg';
  if (lower.includes('pillow') || lower.includes('cushion')) return '/images/products/pillow.jpg';
  if (lower.includes('couch') || lower.includes('sofa') || lower.includes('chair')) return '/images/products/couch.jpg';
  if (lower.includes('couple')) return '/images/products/couple-gift.jpg';
  if (lower.includes('canvas') || lower.includes('design') || lower.includes('art')) return '/images/products/canvas.jpg';
  return '/images/products/tshirt.jpg';
}

function resolveBadge(title: string, currentBadge?: string): string {
  if (currentBadge && currentBadge.trim() !== '') return currentBadge;
  const lower = title.toLowerCase();
  if (lower.includes('shirt')) return 'Bestseller';
  if (lower.includes('heart')) return 'Most Loved';
  if (lower.includes('pillow')) return 'Trending';
  if (lower.includes('couch')) return 'Luxury';
  if (lower.includes('couple')) return 'Special Set';
  if (lower.includes('design')) return 'Popular';
  return '';
}

async function checkAdminAuth() {
  const session = await getSessionUser();
  if (session && (session.role === 'admin' || isAdminEmail(session.email))) {
    return { authorized: true, user: session };
  }
  return { authorized: false, user: session };
}

// GET all products for Admin Dashboard
export async function GET() {
  const { authorized } = await checkAdminAuth();
  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required. Current admin: pkashyap1506@gmail.com' },
      { status: 403 }
    );
  }

  let products: unknown[] = [];

  try {
    await connectToDatabase();
    const dbProducts = await Product.find({}).sort({ createdAt: -1 }).lean();
    if (dbProducts && dbProducts.length > 0) {
      products = dbProducts.map((p) => {
        const img = resolveImage(p.title, p.image || (p.images && p.images[0]));
        const badge = resolveBadge(p.title, p.badge);
        const origPrice = p.originalPrice && p.originalPrice > 0 ? p.originalPrice : Math.round(p.price * 1.35);

        return {
          id: p._id.toString(),
          title: p.title,
          description: p.description,
          price: p.price,
          originalPrice: origPrice,
          image: img,
          images: p.images && p.images.length > 0 ? p.images : [img],
          imageColor: p.imageColor || '#f3f4f6',
          category: p.category || 'General',
          stock: p.stock !== undefined ? p.stock : 50,
          badge: badge,
          rating: p.rating || 4.9,
          reviews: p.reviews || 20,
          status: p.status || 'active',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        };
      });
    }
  } catch (err) {
    console.warn('MongoDB connection deferred, loading from fallback store:', err);
  }

  if (products.length === 0) {
    products = fallbackProductStore.getAll();
  }

  return NextResponse.json({
    success: true,
    products,
  });
}

// POST create new product
export async function POST(req: Request) {
  const { authorized } = await checkAdminAuth();
  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required. Current admin: pkashyap1506@gmail.com' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      description = '',
      price,
      originalPrice = 0,
      image = '/images/products/tshirt.jpg',
      images = [],
      category = 'General',
      stock = 50,
      badge = '',
      status = 'active',
    } = body;

    if (!title || price === undefined) {
      return NextResponse.json(
        { error: 'Title and price are required.' },
        { status: 400 }
      );
    }

    const productData: Partial<FallbackProduct> & { title: string; price: number } = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: Number(originalPrice) || 0,
      image: image || '/images/products/tshirt.jpg',
      images: images.length > 0 ? images : [image || '/images/products/tshirt.jpg'],
      category: category.trim(),
      stock: Number(stock) || 0,
      badge: badge.trim(),
      status: (status as 'active' | 'out_of_stock' | 'draft') || 'active',
      rating: 5.0,
      reviews: 1,
    };

    let createdProduct: unknown = null;

    // 1. Save to MongoDB if available
    try {
      await connectToDatabase();
      const dbProd = await Product.create({
        ...productData,
      });
      createdProduct = {
        id: dbProd._id.toString(),
        ...productData,
        createdAt: dbProd.createdAt,
      };
    } catch (dbErr) {
      console.warn('MongoDB save deferred to fallback store:', dbErr);
    }

    // 2. Always persist to fallback store so it is immediately available
    const fbProd = fallbackProductStore.save(productData);
    if (!createdProduct) {
      createdProduct = fbProd;
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully.',
      product: createdProduct,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT update price, stock, image, status, or details
export async function PUT(req: Request) {
  const { authorized } = await checkAdminAuth();
  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required. Current admin: pkashyap1506@gmail.com' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    if (updates.image) {
      updates.images = [updates.image];
    }

    // Update in MongoDB
    try {
      await connectToDatabase();
      const mongoose = await import('mongoose');
      if (mongoose.default.Types.ObjectId.isValid(id)) {
        await Product.findByIdAndUpdate(id, { $set: updates });
      } else {
        await Product.updateOne({ id }, { $set: updates });
      }
    } catch (dbErr) {
      console.warn('MongoDB update deferred to fallback store:', dbErr);
    }

    // Update in fallback store
    const updated = fallbackProductStore.update(id, updates);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(req: Request) {
  const { authorized } = await checkAdminAuth();
  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required. Current admin: pkashyap1506@gmail.com' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    // Delete in MongoDB
    try {
      await connectToDatabase();
      await Product.findByIdAndDelete(id);
    } catch (dbErr) {
      console.warn('MongoDB delete deferred to fallback store:', dbErr);
    }

    // Delete in fallback store
    fallbackProductStore.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
