import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { S3_BUCKET, s3Client } from '../config/s3.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface UploadedObject {
  key: string;
  url: string;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
}

export async function uploadFile(params: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  userId: string;
}): Promise<UploadedObject> {
  const safeName = sanitizeFilename(params.originalName);
  const key = `users/${params.userId}/${uuid()}-${safeName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: params.buffer,
      ContentType: params.mimeType,
      ServerSideEncryption: 'AES256',
    })
  );

  const url = `https://${S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${encodeURI(key)}`;
  return { key, url };
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch (err) {
    logger.warn({ err, key }, 'Failed to delete S3 object');
  }
}
