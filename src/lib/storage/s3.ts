import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getEnv } from "@/lib/env";

let cachedClient: S3Client | null = null;

export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const env = getEnv();
  cachedClient = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
  });
  return cachedClient;
}

export async function ensureBucketExists(): Promise<string> {
  const env = getEnv();
  const client = getS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
  }
  return env.S3_BUCKET;
}

export async function createPresignedUploadUrl(
  storageKey: string,
  contentType: string,
  expiresInSeconds = 900
): Promise<string> {
  const bucket = await ensureBucketExists();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

export async function createPresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 900
): Promise<string> {
  const bucket = await ensureBucketExists();
  const command = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
}

export async function putObjectBuffer(
  storageKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const bucket = await ensureBucketExists();
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getObjectBuffer(storageKey: string): Promise<{ body: Buffer; contentType: string }> {
  const bucket = await ensureBucketExists();
  const res = await getS3Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    })
  );
  if (!res.Body) {
    throw new Error("ไม่พบเนื้อหาไฟล์ในระบบจัดเก็บ");
  }
  const bytes = await res.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: res.ContentType ?? "application/octet-stream",
  };
}

export function sanitizeFileName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_");
  return cleaned.length > 0 ? cleaned.slice(0, 120) : "file";
}
