import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Route modules import this file (and therefore evaluate it) before app.ts's
// dotenv.config() call runs, since ESM static imports are hoisted ahead of the
// rest of the importing module's body. Configuring cloudinary here at module
// load time would freeze it with undefined credentials for the process's
// lifetime, so configure lazily on each use instead, once env vars are loaded.
const configureCloudinary = (): void => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export const uploadToCloudinary = (buffer: Buffer, folder = 'salons'): Promise<string> => {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          // The Cloudinary SDK rejects with a plain object, not an Error instance, so it
          // was falling through asyncHandler's type checks into a generic 500 message
          // that hid the real cause (e.g. a restricted API key missing upload permission).
          // eslint-disable-next-line no-console
          console.error('Cloudinary upload failed:', error);
          reject(new Error(error.message || 'Image upload failed'));
        } else {
          resolve(result!.secure_url);
        }
      },
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const signUploadParams = (paramsToSign: Record<string, string | number>): string => {
  return cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET as string);
};

export { cloudinary };
