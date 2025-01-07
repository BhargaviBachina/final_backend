// const express = require('express');
// const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const path = require('path');
// const dotenv = require('dotenv');


// dotenv.config(); // Load environment variables

// const router = express.Router();

// // Configure AWS S3 (using v3 SDK)
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// // Set up multer storage with multer-s3 to upload directly to S3
// const upload = multer({
//     storage: multerS3({
//       s3: s3,
//       bucket: process.env.AWS_S3_BUCKET,
//       key: function (req, file, cb) {
//         const email = "bachina.bhargavi03@gmail.com"; // Replace this with the dynamic email if needed
//         const encodedEmail = encodeURIComponent(email); // URL encode the email to handle special characters
//         const timestamp = Date.now();
//         const fileName = `${encodedEmail}_${timestamp}${path.extname(file.originalname)}`; // Prepend email and timestamp to the filename
//         cb(null, fileName); // Assign the custom filename to the file
//       },
//     }),
//   });

// // Route to upload a file to S3
// router.post('/upload', upload.single('file'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   const file = {
//     id: req.file.key, // Use the S3 key as the file ID
//     name: req.file.originalname,
//     link: req.file.location, // The public URL of the uploaded file
//   };

//   // Here, you could save file details to the database, if necessary

//   return res.json({
//     message: 'File uploaded successfully',
//     file,
//   });
// });

// // Route to list all uploaded files from S3
// router.get('/', async (req, res) => {
//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET,
//   };

//   try {
//     const { Contents } = await s3.send(new ListObjectsV2Command(params));
//     const files = Contents.map((file) => ({
//       id: file.Key,
//       name: file.Key,
//       link: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${file.Key}`,
//     }));

//     return res.json({ files });
//   } catch (error) {
//     return res.status(500).json({ error: 'Error fetching files from S3' });
//   }
// });

// // Route to delete a file from S3
// router.delete('/:fileId', async (req, res) => {
//   const fileId = req.params.fileId;

//   const params = {
//     Bucket: process.env.AWS_S3_BUCKET,
//     Key: fileId,
//   };

//   try {
//     await s3.send(new DeleteObjectCommand(params));
//     return res.json({ message: 'File deleted successfully' });
//   } catch (error) {
//     return res.status(500).json({ error: 'Error deleting file from S3' });
//   }
// });

// module.exports = router;

const express = require('express');
const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const dotenv = require('dotenv');
const db = require('../../../config/knex'); // Import knex instance
const { verifyToken } = require('../../helpers/authMiddleware'); // Import verifyToken middleware

dotenv.config(); // Load environment variables

const router = express.Router();

// Configure AWS S3 (using v3 SDK)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Set up multer storage with multer-s3 to upload directly to S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      const userId = req.userId; // Assuming JWT token has userId
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}${path.extname(file.originalname)}`;
      cb(null, fileName); // Assign the custom filename to the file
    },
  }),
});

// Route to upload a file to S3 and save metadata in MySQL
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = req.userId;

  const file = {
    user_id: userId,
    file_name: req.file.originalname,
    s3_key: req.file.key,
    file_url: req.file.location,
  };

  // Insert file metadata into MySQL
  db('files')
    .insert(file)
    .then((result) => {
      return res.json({
        message: 'File uploaded successfully',
        file: { id: result[0], ...file },  // Return inserted file metadata along with auto-generated ID
      });
    })
    .catch((err) => {
      console.error('Error inserting file metadata:', err);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    });
});

// Route to list all uploaded files by the authenticated user
router.get('/', verifyToken, (req, res) => {
  const userId = req.userId;

  db('files')
    .where('user_id', userId)  // Only fetch files uploaded by the authenticated user
    .select('*')
    .then((files) => {
      return res.json({ files });
    })
    .catch((err) => {
      console.error('Error fetching files:', err);
      return res.status(500).json({ error: 'Error fetching files' });
    });
});

// Route to delete a file from S3 and remove metadata from MySQL
router.delete('/:fileId', verifyToken, (req, res) => {
  const fileId = req.params.fileId;
  const userId = req.userId;

  // Find the file in the database
  db('files')
    .where({ id: fileId, user_id: userId })  // Ensure the file belongs to the authenticated user
    .first()
    .then((file) => {
      if (!file) {
        return res.status(404).json({ error: 'File not found or you do not have permission to delete it' });
      }

      // Delete file from S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: file.s3_key,
      };

      s3.send(new DeleteObjectCommand(params))
        .then(() => {
          // If successful, delete file metadata from MySQL
          db('files')
            .where('id', fileId)
            .del()
            .then(() => {
              return res.json({ message: 'File deleted successfully' });
            })
            .catch((err) => {
              console.error('Error deleting file metadata from database:', err);
              return res.status(500).json({ error: 'Failed to delete file metadata from database' });
            });
        })
        .catch(() => {
          return res.status(500).json({ error: 'Error deleting file from S3' });
        });
    })
    .catch((err) => {
      console.error('Error finding file in database:', err);
      return res.status(500).json({ error: 'Error finding file' });
    });
});

module.exports = router;
