import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

let s3Client = null;

const isR2Configured = 
  process.env.R2_ACCESS_KEY_ID && 
  process.env.R2_SECRET_ACCESS_KEY && 
  process.env.R2_ENDPOINT && 
  process.env.R2_BUCKET_NAME;

if (isR2Configured) {
  try {
    s3Client = new S3Client({
      endpoint: process.env.R2_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  } catch (error) {
    console.error('Error initializing Cloudflare R2 Client:', error);
  }
}

/**
 * Uploads a file buffer to Cloudflare R2 or falls back to local storage in development.
 * @param {Buffer} buffer - File buffer.
 * @param {string} fileName - Destination file name.
 * @param {string} mimeType - File MIME type.
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export async function uploadFile(buffer, fileName, mimeType) {
  const cleanFileName = Date.now() + '-' + fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL || '';

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: cleanFileName,
        Body: buffer,
        ContentType: mimeType,
      });

      await s3Client.send(command);

      // Return public URL
      if (publicUrl) {
        return `${publicUrl.replace(/\/$/, '')}/${cleanFileName}`;
      } else {
        // Fallback endpoint URL
        return `${process.env.R2_ENDPOINT}/${bucketName}/${cleanFileName}`;
      }
    } catch (error) {
      console.error('R2 Upload failed, trying local upload fallback:', error);
    }
  }

  // Local filesystem fallback (development / mock mode)
  console.warn('R2 is not configured or failed. Saving file locally.');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, cleanFileName);
  fs.writeFileSync(filePath, buffer);

  // Return local relative path (storefront can load this if it's served)
  return `/uploads/${cleanFileName}`;
}
