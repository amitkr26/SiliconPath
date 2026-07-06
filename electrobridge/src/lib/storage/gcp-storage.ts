import { Storage } from '@google-cloud/storage';

// Initialize the GCP Storage client
let storage: Storage;

if (process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64) {
  const credentialsJson = Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS_BASE64, 'base64').toString('utf8');
  const credentials = JSON.parse(credentialsJson);
  storage = new Storage({ credentials });
} else {
  // Fallback to standard environment variables (GOOGLE_APPLICATION_CREDENTIALS)
  storage = new Storage();
}

export async function uploadToCloudStorage(
  buffer: Buffer, 
  filename: string, 
  contentType: string
): Promise<string> {
  const bucketName = process.env.GCP_STORAGE_BUCKET_NAME;
  const cdnDomain = process.env.GCP_CDN_DOMAIN;

  if (!bucketName) {
    throw new Error('GCP_STORAGE_BUCKET_NAME is not configured.');
  }

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  // If a CDN domain is configured, return the CDN URL
  // Otherwise, fallback to the public GCP storage URL
  if (cdnDomain) {
    // Ensure cdnDomain doesn't have a trailing slash
    const domain = cdnDomain.replace(/\/$/, '');
    return `${domain}/${filename}`;
  } else {
    return `https://storage.googleapis.com/${bucketName}/${filename}`;
  }
}
