const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const firebaseService = require('./firebaseService');

class ReplicateService {
  constructor() {
    this.replicate = new Replicate({
      auth: config.replicate.apiToken,
    });
    
    // IDM-VTON model configuration
    this.model = "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";
  }

  /**
   * Upload image to Firebase Storage and return URL
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageToStorage(imagePath) {
    try {
      // Check if Firebase is configured
      if (!firebaseService.isConfigured()) {
        console.warn('⚠️ Firebase not configured, falling back to local file serving');
        // Fallback to local file serving for development
        const fileName = path.basename(imagePath);
        const publicUrl = `http://localhost:${config.server.port}/uploads/${fileName}`;
        console.log(`Image served locally: ${publicUrl}`);
        return publicUrl;
      }

      // Upload to Firebase Storage
      const publicUrl = await firebaseService.uploadFile(imagePath);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      throw new Error('Failed to upload image to storage');
    }
  }

  /**
   * Generate a virtual try-on image using IDM-VTON model
   * @param {string} personImagePath - Path to the person image
   * @param {string} garmentImagePath - Path to the garment image
   * @param {string} textPrompt - Additional text prompt for context (garment description)
   * @returns {Promise<Object>} - Prediction result with output URL
   */
  async generateTryOn(personImagePath, garmentImagePath, textPrompt = '') {
    let uploadedUrls = [];
    
    try {
      // Validate input files exist
      if (!fs.existsSync(personImagePath)) {
        throw new Error('Person image file not found');
      }
      if (!fs.existsSync(garmentImagePath)) {
        throw new Error('Garment image file not found');
      }

      console.log('Starting IDM-VTON prediction...');

      // Upload images to Firebase Storage and get URLs
      const [humanImgUrl, garmImgUrl] = await Promise.all([
        this.uploadImageToStorage(personImagePath),
        this.uploadImageToStorage(garmentImagePath)
      ]);

      uploadedUrls = [humanImgUrl, garmImgUrl];

      // Prepare the input for IDM-VTON model
      const input = {
        garm_img: garmImgUrl,
        human_img: humanImgUrl,
        garment_des: textPrompt || 'garment'
      };

      console.log('Model input prepared:', {
        humanImg: humanImgUrl,
        garmentImg: garmImgUrl,
        garmentDescription: textPrompt || 'garment'
      });

      // Run the prediction using the correct Replicate API pattern
      const output = await this.replicate.run(this.model, { input });

      console.log('Prediction completed successfully');

      // Return the result with the output URL
      return {
        success: true,
        outputUrl: output,
        input: {
          humanImg: humanImgUrl,
          garmentImg: garmImgUrl,
          garmentDescription: textPrompt || 'garment'
        }
      };

    } catch (error) {
      console.error('Error in generateTryOn:', error);
      
      // Clean up uploaded files on error (if Firebase is configured)
      if (firebaseService.isConfigured() && uploadedUrls.length > 0) {
        console.log('Cleaning up uploaded files due to error...');
        await Promise.all(
          uploadedUrls.map(url => firebaseService.deleteFile(url))
        );
      }
      
      throw error;
    }
  }

  /**
   * Get prediction status (for async predictions if needed)
   * @param {string} predictionId - The prediction ID
   * @returns {Promise<Object>} - Prediction status
   */
  async getPredictionStatus(predictionId) {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);
      return prediction;
    } catch (error) {
      console.error('Error getting prediction status:', error);
      throw error;
    }
  }

  /**
   * Cancel a prediction
   * @param {string} predictionId - The prediction ID
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelPrediction(predictionId) {
    try {
      const result = await this.replicate.predictions.cancel(predictionId);
      return result;
    } catch (error) {
      console.error('Error canceling prediction:', error);
      throw error;
    }
  }

  /**
   * Get storage service info
   * @returns {Object} - Storage service information
   */
  getStorageInfo() {
    if (firebaseService.isConfigured()) {
      return {
        type: 'firebase',
        ...firebaseService.getBucketInfo()
      };
    } else {
      return {
        type: 'local',
        url: `http://localhost:${config.server.port}/uploads`
      };
    }
  }
}

module.exports = new ReplicateService(); 