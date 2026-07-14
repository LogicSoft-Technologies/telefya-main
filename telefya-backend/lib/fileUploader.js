const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const imageSize = require('image-size').imageSize;
const { randomStr } = require('./randomStr'); // Assuming you have a random string generator
// Multer configuration
const configureMulter = (storagePath) => {
  const ensureDirectory = async () => {
    try {
      await fs.mkdir(storagePath, { recursive: true });
    } catch (error) {
      console.error('Error creating directory:', error.message);
    }
  };

  ensureDirectory();

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, storagePath);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomStr(32)}${extension}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 12 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const validExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!validExts.includes(ext)) {
        return cb(new Error(`Invalid file extension: ${ext}. Allowed: ${validExts.join(', ')}`));
      }
      cb(null, true);
    },
  });
};

// Image validation function
const validateImage = async (file, config) => {
  const errors = [];

  // Check if file exists and is accessible
  try {
    const stats = await fs.stat(file.path);
    if (stats.size === 0) {
      errors.push(`${file.originalname}: File is empty`);
      return errors;
    }
  } catch (error) {
    errors.push(`${file.originalname}: File not found or inaccessible: ${error.message}`);
    return errors;
  }

  // Size validation (convert bytes to MB)
  const stats = await fs.stat(file.path);
  if (stats.size > config.size * 1024 * 1024) {
    errors.push(`${file.originalname}: Size ${stats.size} exceeds ${config.size}MB limit`);
  }

  // Dimension validation
  let dimensions;
  try {
    // Read file as buffer to avoid disk read issues
    const buffer = await fs.readFile(file.path);
    dimensions = imageSize(buffer); // Use buffer instead of file path
  } catch (error) {
    errors.push(`${file.originalname}: Unable to read image dimensions: ${error.message}`);
    return errors;
  }

  if (dimensions.width > config.width) {
    errors.push(`${file.originalname}: Width ${dimensions.width}px exceeds ${config.width}px`);
  }

  if (dimensions.height > config.height) {
    errors.push(`${file.originalname}: Height ${dimensions.height}px exceeds ${config.height}px`);
  }

  // Extension validation
  const fileExt = dimensions.type?.toLowerCase();
  if (config.validExts.length > 0 && !config.validExts.includes(fileExt)) {
    errors.push(`${file.originalname}: Extension ${fileExt} not allowed. Allowed: ${config.validExts.join(', ')}`);
  }

  return errors;
};

// Main uploader class
class FileUploader {
  constructor({
    fieldName = 'image',
    storagePath = './uploads',
    maxSizeMB = 10,
    maxWidth = 5000,
    maxHeight = 5000,
    validExts = ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  } = {}) {
    this.config = {
      fieldName,
      storagePath,
      size: maxSizeMB,
      width: maxWidth,
      height: maxHeight,
      validExts: validExts.map(ext => ext.toLowerCase()),
    };
    this.uploader = configureMulter(storagePath);
  }

  async upload(req, res, options = {}) {
    const { isSingle = false, resize = [], callback } = options;

    sharp.cache({ files: 0 });

    try {
      // Configure multer middleware
      const uploadMiddleware = isSingle
        ? this.uploader.single(this.config.fieldName)
        : this.uploader.array(this.config.fieldName, 12);

      // Handle upload
      await new Promise((resolve, reject) => {
        uploadMiddleware(req, res, (err) => {
          if (err instanceof multer.MulterError) {
            return reject({
              error: true,
              message: `Upload error: ${err.message}`,
              info: `Field name should be '${this.config.fieldName}'`,
            });
          }
          if (err) {
            return reject({
              error: true,
              message: `Upload error: ${err.message}`,
            });
          }
          resolve();
        });
      });

      // Process uploaded files
      const files = isSingle ? [req.file] : req.files;
      if (!files || files.length === 0) {
        throw new Error('No files uploaded');
      }

      const validFiles = files.filter(file => file);
      const results = [];
      const errors = [];

      for (const file of validFiles) {
        console.log(`Processing file: ${file.path}, Size: ${file.size}`); // Debug
        // Validate file
        const validationErrors = await validateImage(file, this.config);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          await fs.unlink(file.path).catch(() => {});
          continue;
        }

        let filePath = file.path.replace(/\\/g, '/');

        // Handle resize if requested
        if (resize.length > 0) {
          const { width, height } = resize[0];
          const dimensions = imageSize(await fs.readFile(file.path));
          const resizeName = `${filePath.split('.')[0]}__${randomStr(12)}.${dimensions.type}`;

          try {
            await sharp(filePath)
              .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
              })
              .toFile(resizeName);
            await fs.unlink(filePath).catch(() => {});
            filePath = resizeName;
          } catch (error) {
            errors.push(`${file.originalname}: Resize failed: ${error.message}`);
            await fs.unlink(file.path).catch(() => {});
            continue;
          }
        }

        results.push({ path: filePath });
      }

      if (errors.length > 0) {
        return callback?.({ error: true, messages: errors }, null);
      }

      return callback?.(null, { success: true, data: results }) || {
        success: true,
        error: false,
        message: 'Upload successful',
        data: results,
      };
    } catch (error) {
      const errorResponse = {
        error: true,
        message: error.message || 'Upload failed',
      };
      return callback?.(errorResponse, null) || errorResponse;
    }
  }
}

module.exports = { FileUploader };