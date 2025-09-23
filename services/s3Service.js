const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class S3Service {
  constructor() {
    // Validate required environment variables
    if (!process.env.AWS_ACCESS_KEY_ID) {
      throw new Error('AWS_ACCESS_KEY_ID environment variable is required');
    }
    if (!process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_SECRET_ACCESS_KEY environment variable is required');
    }
    if (!process.env.AWS_REGION) {
      throw new Error('AWS_REGION environment variable is required');
    }
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is required');
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      endpoint: process.env.AWS_S3_ENDPOINT || undefined, // For custom endpoints like LocalStack
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME;

    // Log successful initialization
    console.log(`✅ S3Service initialized for bucket: ${this.bucketName} in region: ${process.env.AWS_REGION}`);
  }

  /**
   * Upload a file to S3
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} fileName - Original filename
   * @param {string} contentType - MIME type
   * @param {string} folder - S3 folder (e.g., 'receipts', 'invoices')
   * @returns {Promise<object>} - Upload result with key and URL
   */
  async uploadFile(fileBuffer, fileName, contentType, folder = 'receipts') {
    try {
      // Generate unique filename
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const s3Key = `${folder}/${uniqueFileName}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
        }
      };

      const command = new PutObjectCommand(uploadParams);
      const result = await this.s3Client.send(command);

      return {
        success: true,
        key: s3Key,
        originalName: fileName,
        contentType: contentType,
        size: fileBuffer.length,
        etag: result.ETag,
        url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for secure file access
   * @param {string} s3Key - The S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns {Promise<string>} - Presigned URL
   */
  async getPresignedUrl(s3Key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresIn,
      });

      return presignedUrl;
    } catch (error) {
      console.error('Presigned URL Error:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} s3Key - The S3 object key
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(s3Key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in S3
   * @param {string} s3Key - The S3 object key
   * @returns {Promise<boolean>} - Whether file exists
   */
  async fileExists(s3Key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param {string} s3Key - The S3 object key
   * @returns {Promise<object>} - File metadata
   */
  async getFileMetadata(s3Key) {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const result = await this.s3Client.send(command);

      return {
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        metadata: result.Metadata,
      };
    } catch (error) {
      console.error('S3 Metadata Error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Extract S3 key from full S3 URL
   * @param {string} s3Url - Full S3 URL
   * @returns {string|null} - S3 key or null if invalid URL
   */
  extractS3Key(s3Url) {
    if (!s3Url) return null;

    try {
      // Handle both path-style and virtual-hosted-style URLs
      const url = new URL(s3Url);

      // Virtual-hosted-style: https://bucket-name.s3.region.amazonaws.com/key
      if (url.hostname.includes('.s3.')) {
        return url.pathname.substring(1); // Remove leading slash
      }

      // Path-style: https://s3.region.amazonaws.com/bucket-name/key
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 2 && pathParts[1] === this.bucketName) {
        return pathParts.slice(2).join('/');
      }

      return null;
    } catch (error) {
      console.error('Invalid S3 URL:', s3Url);
      return null;
    }
  }

  /**
   * Validate file type for receipt uploads
   * @param {string} contentType - MIME type
   * @returns {boolean} - Whether file type is allowed
   */
  isValidReceiptFileType(contentType) {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'image/webp'
    ];

    return allowedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Validate file size
   * @param {number} fileSize - File size in bytes
   * @param {number} maxSizeInMB - Maximum size in MB (default: 10MB)
   * @returns {boolean} - Whether file size is valid
   */
  isValidFileSize(fileSize, maxSizeInMB = 10) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return fileSize <= maxSizeInBytes;
  }
}

module.exports = new S3Service();