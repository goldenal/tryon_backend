const path = require('path');
const fs = require('fs');
const replicateService = require('../services/replicateService');
const config = require('../config/config');

/**
 * Clean up uploaded files
 * @param {Array} filePaths - Array of file paths to delete
 */
function cleanupFiles(filePaths) {
  filePaths.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up local file:', filePath);
      }
    } catch (error) {
      console.error('Error cleaning up local file:', filePath, error);
    }
  });
}

class TryOnController {
  /**
   * Generate virtual try-on image
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateTryOn(req, res) {
    try {
      // Validate request
      if (!req.files || !req.files.personImage || !req.files.garmentImage) {
        return res.status(400).json({
          success: false,
          error: 'Both person image and garment image are required',
        });
      }

      const personImage = req.files.personImage[0];
      const garmentImage = req.files.garmentImage[0];
      const textPrompt = req.body.textPrompt || '';

      // Validate file types
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(personImage.mimetype) || !allowedMimes.includes(garmentImage.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
        });
      }

      console.log('Processing try-on request:', {
        personImage: personImage.filename,
        garmentImage: garmentImage.filename,
        textPrompt: textPrompt || 'None',
      });

      // Generate try-on image
      const result = await replicateService.generateTryOn(
        personImage.path,
        garmentImage.path,
        textPrompt
      );

      // Clean up uploaded files after processing
      cleanupFiles([personImage.path, garmentImage.path]);

      // Get storage service information
      const storageInfo = replicateService.getStorageInfo();

      // Return success response with output URL and storage info
      return res.status(200).json({
        success: true,
        data: {
          outputUrl: result.outputUrl,
          input: result.input,
          storage: storageInfo,
          message: 'Virtual try-on generated successfully'
        }
      });

    } catch (error) {
      console.error('Error in generateTryOn controller:', error);
      
      // Clean up files on error
      if (req.files) {
        const filePaths = Object.values(req.files).flat().map(file => file.path);
        cleanupFiles(filePaths);
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to generate virtual try-on',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get prediction status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPredictionStatus(req, res) {
    try {
      const { predictionId } = req.params;

      if (!predictionId) {
        return res.status(400).json({
          success: false,
          error: 'Prediction ID is required',
        });
      }

      const prediction = await replicateService.getPredictionStatus(predictionId);

      return res.status(200).json({
        success: true,
        data: {
          id: prediction.id,
          status: prediction.status,
          output: prediction.output,
          error: prediction.error,
          createdAt: prediction.created_at,
          completedAt: prediction.completed_at,
        },
      });

    } catch (error) {
      console.error('Error in getPredictionStatus controller:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to get prediction status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Cancel a prediction
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cancelPrediction(req, res) {
    try {
      const { predictionId } = req.params;

      if (!predictionId) {
        return res.status(400).json({
          success: false,
          error: 'Prediction ID is required',
        });
      }

      const result = await replicateService.cancelPrediction(predictionId);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Prediction canceled successfully',
      });

    } catch (error) {
      console.error('Error in cancelPrediction controller:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel prediction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    const storageInfo = replicateService.getStorageInfo();
    
    return res.status(200).json({
      success: true,
      message: 'Try-on service is healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      storage: storageInfo,
    });
  }
}

module.exports = new TryOnController(); 