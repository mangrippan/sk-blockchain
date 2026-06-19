/**
 * File Validation Middleware
 * Validates file magic bytes (file signature) to prevent upload of malicious files
 */

const fs = require('fs');
const { fromBuffer } = require('file-type');

/**
 * Allowed MIME types and their magic bytes
 */
const ALLOWED_TYPES = {
  'application/pdf': {
    ext: 'pdf',
    mime: 'application/pdf',
    // PDF magic bytes: %PDF-
    signature: [0x25, 0x50, 0x44, 0x46],
  },
  'image/jpeg': {
    ext: 'jpg',
    mime: 'image/jpeg',
    // JPEG magic bytes: FF D8 FF
    signature: [0xFF, 0xD8, 0xFF],
  },
  'image/png': {
    ext: 'png',
    mime: 'image/png',
    // PNG magic bytes: 89 50 4E 47
    signature: [0x89, 0x50, 0x4E, 0x47],
  },
};

/**
 * Validate file magic bytes
 * Reads the first few bytes of file to verify actual file type
 * 
 * @param {string} filePath - Path to the uploaded file
 * @returns {Promise<object>} - Validation result {isValid, detectedType, message}
 */
async function validateFileMagicBytes(filePath) {
  try {
    // Read first 4100 bytes (enough for file-type detection)
    const buffer = Buffer.alloc(4100);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4100, 0);
    fs.closeSync(fd);

    // Detect file type from magic bytes
    const fileTypeResult = await fromBuffer(buffer);
    
    if (!fileTypeResult) {
      return {
        isValid: false,
        detectedType: null,
        message: 'Could not detect file type from content. File may be corrupted or unsupported.',
      };
    }

    // Check if detected type is in allowed list
    const allowed = Object.values(ALLOWED_TYPES).find(
      t => t.mime === fileTypeResult.mime
    );

    if (!allowed) {
      return {
        isValid: false,
        detectedType: fileTypeResult.mime,
        message: `File type ${fileTypeResult.mime} is not allowed. Allowed types: PDF, JPEG, PNG.`,
      };
    }

    return {
      isValid: true,
      detectedType: fileTypeResult.mime,
      detectedExt: fileTypeResult.ext,
      message: 'File type validated successfully',
    };

  } catch (error) {
    return {
      isValid: false,
      detectedType: null,
      message: `File validation error: ${error.message}`,
    };
  }
}

/**
 * Express middleware for file upload validation
 * Use after multer middleware
 * 
 * @example
 * router.post('/upload', upload.single('file'), validateUploadedFile, async (req, res) => {
 *   // File is validated
 * });
 */
async function validateUploadedFile(req, res, next) {
  // Skip if no file uploaded
  if (!req.file) {
    return next();
  }

  try {
    const validation = await validateFileMagicBytes(req.file.path);

    if (!validation.isValid) {
      // Delete the invalid file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        error: 'Invalid file type',
        message: validation.message,
        detectedType: validation.detectedType,
      });
    }

    // Attach validation result to request for logging
    req.fileValidation = validation;
    next();

  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      error: 'File validation failed',
      message: error.message,
    });
  }
}

/**
 * Express middleware for validating MULTIPLE uploaded files (req.files)
 * Use after a multer middleware that populates req.files (e.g. upload.any()/array()).
 * Validates every file's magic bytes; on the first invalid file, deletes ALL
 * uploaded files and responds 400 so the request never proceeds with a partial set.
 *
 * @example
 * router.post('/upload', upload.any(), validateUploadedFiles, async (req, res) => {
 *   // req.files are all validated
 * });
 */
async function validateUploadedFiles(req, res, next) {
  // Skip if no files uploaded
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const deleteAll = () => {
    for (const f of req.files) {
      if (f.path && fs.existsSync(f.path)) {
        fs.unlinkSync(f.path);
      }
    }
  };

  try {
    for (const file of req.files) {
      const validation = await validateFileMagicBytes(file.path);

      if (!validation.isValid) {
        deleteAll();
        return res.status(400).json({
          error: 'Invalid file type',
          message: `${file.originalname}: ${validation.message}`,
          detectedType: validation.detectedType,
        });
      }
    }

    next();
  } catch (error) {
    deleteAll();
    return res.status(500).json({
      error: 'File validation failed',
      message: error.message,
    });
  }
}

module.exports = {
  validateFileMagicBytes,
  validateUploadedFile,
  validateUploadedFiles,
  ALLOWED_TYPES,
};
