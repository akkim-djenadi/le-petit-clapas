const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFromUrl = async (url, folder = 'petit-clapas') => {
  const result = await cloudinary.uploader.upload(url, {
    folder,
    resource_type: 'image',
    format: 'webp',
    quality: 'auto',
    fetch_format: 'auto',
  });
  return { url: result.secure_url, public_id: result.public_id };
};

const uploadFromBuffer = async (buffer, folder = 'petit-clapas') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder, resource_type: 'image', format: 'webp', quality: 'auto' },
      (err, result) => err ? reject(err) : resolve({ url: result.secure_url, public_id: result.public_id })
    ).end(buffer);
  });
};

const deleteImage = async (public_id) => {
  await cloudinary.uploader.destroy(public_id);
};

module.exports = { uploadFromUrl, uploadFromBuffer, deleteImage };
