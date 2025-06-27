const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      // Check if Firebase is configured
      if (!this.isConfigured()) {
        console.log('⚠️ Firebase not configured - using local storage fallback');
        return;
      }

      // Check if Firebase is already initialized
      if (admin.apps.length > 0) {
        this.app = admin.apps[0];
        this.bucket = this.app.storage().bucket(config.firebase.storageBucket);
        this.initialized = true;
        console.log('✅ Firebase already initialized');
        return;
      }

      // Initialize Firebase with service account credentials
      const serviceAccount = {
        type: 'service_account',
        project_id: config.firebase.projectId,
        private_key_id: config.firebase.privateKeyId,
        private_key: config.firebase.privateKey.replace(/\\n/g, '\n'),
        client_email: config.firebase.clientEmail,
        client_id: config.firebase.clientId,
        auth_uri: config.firebase.authUri,
        token_uri: config.firebase.tokenUri,
        auth_provider_x509_cert_url: config.firebase.authProviderX509CertUrl,
        client_x509_cert_url: config.firebase.clientX509CertUrl,
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: config.firebase.storageBucket,
      });

      this.bucket = this.app.storage().bucket(config.firebase.storageBucket);
      this.initialized = true;
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      this.initialized = false;
      console.log('⚠️ Falling back to local storage');
    }
  }

  /**
   * Upload file to Firebase Storage
   * @param {string} filePath - Local path to the file
   * @param {string} fileName - Name for the file in storage
   * @returns {Promise<string>} - Public URL of the uploaded file
   */
  async uploadFile(filePath, fileName = null) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase not initialized');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error('File does not exist');
      }

      // Generate unique filename if not provided
      const uniqueFileName = fileName || `${uuidv4()}-${path.basename(filePath)}`;
      const storagePath = `uploads/${uniqueFileName}`;

      console.log(`📤 Uploading file to Firebase Storage: ${storagePath}`);

      // Upload file to Firebase Storage
      const [file] = await this.bucket.upload(filePath, {
        destination: storagePath,
        metadata: {
          contentType: this.getContentType(filePath),
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalName: path.basename(filePath),
          },
        },
      });

      // Make the file publicly accessible
      await file.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${storagePath}`;
      
      console.log(`✅ File uploaded successfully: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error('❌ Firebase upload failed:', error);
      throw new Error(`Failed to upload file to Firebase Storage: ${error.message}`);
    }
  }

  /**
   * Delete file from Firebase Storage
   * @param {string} fileUrl - Public URL of the file to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(fileUrl) {
    try {
      if (!this.initialized) {
        console.log('⚠️ Firebase not initialized, skipping file deletion');
        return false;
      }

      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get 'uploads/filename'

      console.log(`🗑️ Deleting file from Firebase Storage: ${filePath}`);

      await this.bucket.file(filePath).delete();
      
      console.log(`✅ File deleted successfully: ${filePath}`);
      return true;

    } catch (error) {
      console.error('❌ Firebase delete failed:', error);
      // Don't throw error for delete operations to avoid breaking the main flow
      return false;
    }
  }

  /**
   * Get content type based on file extension
   * @param {string} filePath - Path to the file
   * @returns {string} - MIME type
   */
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Check if Firebase is properly configured
   * @returns {boolean} - Configuration status
   */
  isConfigured() {
    return !!(
      config.firebase.projectId &&
      config.firebase.privateKey &&
      config.firebase.clientEmail &&
      config.firebase.storageBucket
    );
  }

  /**
   * Get storage bucket info
   * @returns {Object} - Bucket information
   */
  getBucketInfo() {
    if (this.initialized && this.bucket) {
      return {
        name: this.bucket.name,
        projectId: config.firebase.projectId,
        configured: true,
        initialized: true,
      };
    } else {
      return {
        configured: this.isConfigured(),
        initialized: this.initialized,
        message: this.isConfigured() ? 'Firebase configured but not initialized' : 'Firebase not configured',
      };
    }
  }
}

module.exports = new FirebaseService(); 