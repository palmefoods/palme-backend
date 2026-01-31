const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'palme-foods-assets',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi'], 
    resource_type: 'auto', 
  },
});

const upload = multer({ storage: storage });


router.post('/', (req, res) => {
  
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("❌ UPLOAD ERROR DETAILED:", JSON.stringify(err, null, 2));
      console.error("❌ ERROR MESSAGE:", err.message);
      
      
      if (err.http_code) console.error("❌ HTTP CODE:", err.http_code);

      return res.status(500).json({ 
        error: 'Upload failed', 
        details: err.message 
      });
    }

    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    res.json({ 
      url: req.file.path,
      type: req.file.mimetype.startsWith('video') ? 'video' : 'image', 
      message: 'Upload successful!' 
    });
  });
});

module.exports = router;