const express = require('express');
const router = express.Router();
const tryOnController = require('../controllers/tryOnController');
const { uploadBothImages } = require('../middleware/upload');

/**
 * @route POST /api/tryon/generate
 * @desc Generate virtual try-on image
 * @access Public
 */
router.post('/generate', uploadBothImages, tryOnController.generateTryOn);

/**
 * @route GET /api/tryon/status/:predictionId
 * @desc Get prediction status
 * @access Public
 */
router.get('/status/:predictionId', tryOnController.getPredictionStatus);

/**
 * @route DELETE /api/tryon/cancel/:predictionId
 * @desc Cancel a prediction
 * @access Public
 */
router.delete('/cancel/:predictionId', tryOnController.cancelPrediction);

/**
 * @route GET /api/tryon/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', tryOnController.healthCheck);

module.exports = router; 