/** DI token for the active ObjectStore implementation. */
export const OBJECT_STORE = Symbol('OBJECT_STORE');

/** S3-compatible object storage seam (works against real S3 or MinIO). */
export interface ObjectStore {
  presignUpload(
    key: string,
    contentType: string,
    expiresInSeconds?: number,
  ): Promise<{ url: string; key: string }>;
  presignDownload(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}
