import { NextResponse } from 'next/server';
import { getSessionUser, isAdminEmail } from '@/lib/auth';
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || (!isAdminEmail(session.email) && session.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin privileges required.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. If Cloudinary credentials are provided, upload to Cloudinary cloud CDN
    if (isCloudinaryConfigured()) {
      try {
        const cleanName = path
          .basename(file.name, path.extname(file.name))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-');
        const uniqueName = `${cleanName}-${Date.now()}`;
        const cloudResult = await uploadToCloudinary(buffer, 'custom_printing_store/products', uniqueName);

        return NextResponse.json({
          success: true,
          url: cloudResult.secure_url,
          filename: file.name,
          provider: 'cloudinary',
          size: cloudResult.bytes,
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload encountered an error, falling back to local disk:', cloudErr);
      }
    }

    // 2. Try saving to local public/uploads directory (ideal for local development)
    try {
      const uploadDir = path.resolve(process.cwd(), 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path
        .basename(file.name, ext)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const filename = `${cleanBase}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename,
        provider: 'local',
        size: buffer.length,
      });
    } catch (fsErr: unknown) {
      console.warn(
        'Local filesystem write failed (expected in serverless environments like Vercel):',
        fsErr
      );

      // 3. Resilient fallback for serverless read-only platforms: return base64 Data URL
      const mimeType = file.type || 'image/jpeg';
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename: file.name,
        provider: 'base64',
        size: buffer.length,
        message:
          'Uploaded as Base64 Data URL. To host images on Cloudinary CDN, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your Vercel Project Settings.',
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

