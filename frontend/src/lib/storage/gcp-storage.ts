import { Storage } from "@google-cloud/storage";

let storage: Storage;

if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
  const credentialsJson = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, "base64").toString("utf8");
  const credentials = JSON.parse(credentialsJson);
  storage = new Storage({ credentials });
} else {
  storage = new Storage();
}

export async function uploadToCloudStorage(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const bucketName = process.env.GCP_STORAGE_BUCKET_NAME;
  if (!bucketName) throw new Error("GCP_STORAGE_BUCKET_NAME is not configured.");
  const file = storage.bucket(bucketName).file(filename);
  await file.save(buffer, { metadata: { contentType }, resumable: false });
  return `https://storage.googleapis.com/${bucketName}/${filename}`;
}
