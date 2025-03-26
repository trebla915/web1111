import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminStorage } from '@/lib/firebase/admin';

// POST /api/catalog/[bottleId]/upload - Upload an image for a bottle in the catalog
export async function POST(
  request: NextRequest,
  { params }: { params: { bottleId: string } }
) {
  try {
    const { bottleId } = params;
    
    // Verify bottle exists
    const bottleRef = adminFirestore.collection('catalog').doc(bottleId);
    const bottleDoc = await bottleRef.get();
    
    if (!bottleDoc.exists) {
      return NextResponse.json({ error: 'Bottle not found in catalog' }, { status: 404 });
    }
    
    // Get the form data containing the image
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    
    // Check file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Image size should not exceed 5MB' }, { status: 400 });
    }
    
    // Convert File to Buffer for Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `bottles/${bottleId}/${timestamp}-${file.name.replace(/\s+/g, '-')}`;
    
    // Upload to Firebase Storage
    const fileRef = adminStorage.bucket().file(fileName);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });
    
    // Get the public URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '01-01-2100',
    });
    
    // Update the bottle document with the image URL
    await bottleRef.update({
      imageUrl: url,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      message: 'Image uploaded successfully',
      imageUrl: url 
    });
  } catch (error) {
    console.error(`Error uploading image for bottle ${params.bottleId}:`, error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
} 