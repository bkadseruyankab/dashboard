import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Allowed file types
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
  all: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
};

// Max file sizes by type (in bytes)
const MAX_SIZES: Record<string, number> = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  all: 10 * 1024 * 1024, // 10MB
};

// Get file type category
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('text')) return 'document';
  return 'other';
}

// POST upload single file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'general';
    const category = (formData.get('category') as string) || 'all';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ALLOWED_TYPES[category] || ALLOWED_TYPES.all;
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate file size
    const maxSize = MAX_SIZES[category] || MAX_SIZES.all;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${timestamp}_${randomStr}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL and file info
    const publicUrl = `/uploads/${type}/${filename}`;
    const fileType = getFileType(file.type);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      fileType,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// POST upload multiple files - new endpoint
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = (formData.get('type') as string) || 'general';
    const category = (formData.get('category') as string) || 'all';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const allowedTypes = ALLOWED_TYPES[category] || ALLOWED_TYPES.all;
    const maxSize = MAX_SIZES[category] || MAX_SIZES.all;

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles: Array<{
      url: string;
      filename: string;
      originalName: string;
      size: number;
      mimeType: string;
      fileType: string;
    }> = [];

    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          errors.push({ 
            filename: file.name, 
            error: `File type not allowed` 
          });
          continue;
        }

        // Validate file size
        if (file.size > maxSize) {
          errors.push({ 
            filename: file.name, 
            error: `File size exceeds limit` 
          });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'bin';
        const filename = `${timestamp}_${randomStr}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        const publicUrl = `/uploads/${type}/${filename}`;
        const fileType = getFileType(file.type);

        uploadedFiles.push({
          url: publicUrl,
          filename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          fileType,
        });
      } catch (err) {
        errors.push({ 
          filename: file.name, 
          error: 'Failed to upload' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: uploadedFiles.length,
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
