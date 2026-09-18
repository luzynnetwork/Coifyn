import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../config/config.service.js';
import type { ObjectStore } from './object-store.js';

const DEFAULT_EXPIRY_SECONDS = 900;

/**
 * S3-compatible ObjectStore. The client is constructed lazily on first use.
 * Pointing S3_ENDPOINT at a local MinIO instance (with S3_FORCE_PATH_STYLE=true)
 * makes this work identically in dev and against real AWS S3 in prod.
 */
@Injectable()
export class S3ObjectStore implements ObjectStore {
  private client: S3Client | null = null;

  constructor(private readonly config: AppConfigService) {}

  private getClient(): S3Client {
    if (this.client) return this.client;
    this.client = new S3Client({
      region: this.config.get('S3_REGION'),
      endpoint: this.config.get('S3_ENDPOINT'),
      forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE') === 'true',
      credentials:
        this.config.get('S3_ACCESS_KEY_ID') &&
        this.config.get('S3_SECRET_ACCESS_KEY')
          ? {
              accessKeyId: this.config.get('S3_ACCESS_KEY_ID')!,
              secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY')!,
            }
          : undefined,
    });
    return this.client;
  }

  private getBucket(): string {
    const bucket = this.config.get('S3_BUCKET');
    if (!bucket) {
      throw new Error('S3ObjectStore: S3_BUCKET is not set.');
    }
    return bucket;
  }

  async presignUpload(
    key: string,
    contentType: string,
    expiresInSeconds = DEFAULT_EXPIRY_SECONDS,
  ): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.getClient(), command, {
      expiresIn: expiresInSeconds,
    });
    return { url, key };
  }

  async presignDownload(
    key: string,
    expiresInSeconds = DEFAULT_EXPIRY_SECONDS,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.getBucket(), Key: key });
    return getSignedUrl(this.getClient(), command, {
      expiresIn: expiresInSeconds,
    });
  }

  async delete(key: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({ Bucket: this.getBucket(), Key: key }),
    );
  }
}
