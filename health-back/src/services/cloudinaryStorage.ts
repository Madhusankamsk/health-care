import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  // eslint-disable-next-line no-console
  console.warn("Cloudinary is not fully configured. Check CLOUDINARY_* environment variables.");
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName?.trim() && apiKey?.trim() && apiSecret?.trim());
}

/** Maps client file key to Cloudinary public_id (folder + id, extension stripped). */
export function storageKeyToPublicId(key: string): string {
  const trimmed = key.replace(/^\/+/, "").trim();
  const withoutExt = trimmed.replace(/(\.[^/.]+)$/, "");
  const safe = withoutExt.replace(/[^a-zA-Z0-9/_-]/g, "_");
  return `health-care/${safe}`.replace(/\/+/g, "/");
}

export async function uploadObject(params: {
  key: string;
  contentType: string;
  body: Buffer;
}): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  const publicId = storageKeyToPublicId(params.key);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "auto",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        const url = result?.secure_url;
        if (!url) {
          reject(new Error("Cloudinary upload returned no URL"));
          return;
        }
        resolve(url);
      },
    );

    Readable.from(params.body).pipe(uploadStream);
  });
}

export async function deleteObject(key: string): Promise<void> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  const publicId = storageKeyToPublicId(key);
  await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
}
