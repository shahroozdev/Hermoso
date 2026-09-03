import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 1x1 red pixel PNG, base64
const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const dataUri = `data:image/png;base64,${tinyPng}`;

try {
  const res = await cloudinary.uploader.upload(dataUri, { folder: 'salons' });
  console.log('UPLOAD OK:', res.secure_url);
} catch (e) {
  console.log('UPLOAD FAILED:', JSON.stringify({ message: e.message, http_code: e.http_code, name: e.name }));
}
