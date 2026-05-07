import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

export function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}

export function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Photo uploads are temporarily unavailable.");
  }

  cloudinary.config({
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    secure: true,
  });

  return cloudinary;
}

export async function uploadProofImage(params: {
  buffer: Buffer;
  folder: string;
  publicId: string;
}) {
  const client = configureCloudinary();

  return new Promise<{ publicId: string; secureUrl: string }>(
    (resolve, reject) => {
      const stream = client.uploader.upload_stream(
        {
          folder: params.folder,
          overwrite: true,
          public_id: params.publicId,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Photo upload failed."));
            return;
          }

          resolve({
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        },
      );

      stream.end(params.buffer);
    },
  );
}
