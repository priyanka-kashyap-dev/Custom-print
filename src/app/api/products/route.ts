import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Product from '@/models/Product';
import { fallbackProductStore, INITIAL_PRODUCTS } from '@/lib/fallback-store';

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

export async function GET() {
  try {
    let products: unknown[] = [];

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const dbProducts = await Product.find({ status: { $ne: 'draft' } }).sort({ createdAt: -1 }).lean();
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
            reviews: p.reviews || 48,
            status: p.status || 'active',
          };
        });
      }
    } catch (dbErr) {
      console.warn('MongoDB query deferred, using fallback store:', dbErr);
    }

    // 2. Fallback store if DB is empty or connecting
    if (products.length === 0) {
      const fbProducts = fallbackProductStore.getAll();
      products = fbProducts.map((p) => ({
        ...p,
        id: String(p.id),
      }));
    }

    return NextResponse.json({
      success: true,
      products: products.length > 0 ? products : INITIAL_PRODUCTS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message, products: INITIAL_PRODUCTS },
      { status: 500 }
    );
  }
}
