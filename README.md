
# Virtual Try-On Backend

A Node.js backend service that uses the Replicate API with the IDM-VTON model to generate virtual try-on images. The service supports adding extra context to the generated images through text prompts and integrates with Firebase Storage for scalable file management.

## Features

- 🎨 Virtual try-on image generation using IDM-VTON model
- 📝 Text prompt support for garment description
- 🔒 Secure file upload handling
- ☁️ Firebase Storage integration for scalable file management
- ⚡ Rate limiting and security middleware
- 📊 Comprehensive error handling and logging
- 🏥 Health check endpoints
- 🔄 Async prediction status tracking



**Product Image (from Jumia online store):**  
<img src="uploads/product.png" alt="Product" width="300"/>

<table>
  <tr>
    <td><b>Before</b></td>
    <td><b>After</b></td>
  </tr>
  <tr>
    <td><img src="uploads/product.png" alt="Before" width="300"/></td>
    <td><img src="uploads/after.jpg" alt="After" width="300"/></td>
  </tr>
</table> 

## Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- Replicate API account and token
- Firebase project with Storage enabled (optional, falls back to local storage)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tryon_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Replicate API Configuration
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Firebase Configuration (Optional - for production)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_CLIENT_ID=your_firebase_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_firebase_client_cert_url
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
```

5. Get your Replicate API token:
   - Sign up at [replicate.com](https://replicate.com)
   - Go to your account settings
   - Copy your API token
   - Add it to the `.env` file

6. (Optional) Set up Firebase Storage:
   - Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md)
   - Add Firebase configuration to your `.env` file

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Generate Virtual Try-On
**POST** `/api/tryon/generate`

Generate a virtual try-on image by combining a person image with a garment image.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `personImage` (file): Image of the person (JPEG, PNG, WebP)
  - `garmentImage` (file): Image of the garment (JPEG, PNG, WebP)
  - `textPrompt` (string, optional): Garment description for additional context

**Response:**
```json
{
  "success": true,
  "data": {
    "outputUrl": "https://replicate.delivery/pbxt/...",
    "input": {
      "humanImg": "https://storage.googleapis.com/your-bucket/uploads/person.jpg",
      "garmentImg": "https://storage.googleapis.com/your-bucket/uploads/garment.jpg",
      "garmentDescription": "cute pink top"
    },
    "storage": {
      "type": "firebase",
      "name": "your-project-id.appspot.com",
      "projectId": "your-project-id",
      "configured": true
    },
    "message": "Virtual try-on generated successfully"
  }
}
```

#### 2. Get Prediction Status
**GET** `/api/tryon/status/:predictionId`

Check the status of a prediction.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prediction_id_here",
    "status": "processing",
    "output": null,
    "error": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": null
  }
}
```

#### 3. Cancel Prediction
**DELETE** `/api/tryon/cancel/:predictionId`

Cancel a running prediction.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prediction_id_here",
    "status": "canceled"
  },
  "message": "Prediction canceled successfully"
}
```

#### 4. Health Check
**GET** `/api/tryon/health`

Check if the try-on service is healthy.

**Response:**
```json
{
  "success": true,
  "message": "Try-on service is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "storage": {
    "type": "firebase",
    "name": "your-project-id.appspot.com",
    "projectId": "your-project-id",
    "configured": true
  }
}
```

## Usage Examples

### Using cURL

1. **Generate try-on with garment description:**
```bash
curl -X POST http://localhost:3000/api/tryon/generate \
  -F "personImage=@path/to/person.jpg" \
  -F "garmentImage=@path/to/garment.jpg" \
  -F "textPrompt=cute pink top with floral pattern"
```

2. **Check prediction status:**
```bash
curl http://localhost:3000/api/tryon/status/prediction_id_here
```

3. **Cancel prediction:**
```bash
curl -X DELETE http://localhost:3000/api/tryon/cancel/prediction_id_here
```

### Using JavaScript/Fetch

```javascript
// Generate try-on
const formData = new FormData();
formData.append('personImage', personImageFile);
formData.append('garmentImage', garmentImageFile);
formData.append('textPrompt', 'elegant blue dress');

const response = await fetch('http://localhost:3000/api/tryon/generate', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('Output URL:', result.data.outputUrl);
console.log('Storage Info:', result.data.storage);
```

### Using Python/Requests

```python
import requests

# Generate try-on
files = {
    'personImage': open('person.jpg', 'rb'),
    'garmentImage': open('garment.jpg', 'rb')
}
data = {
    'textPrompt': 'casual white t-shirt'
}

response = requests.post(
    'http://localhost:3000/api/tryon/generate',
    files=files,
    data=data
)

result = response.json()
print('Output URL:', result['data']['outputUrl'])
print('Storage Type:', result['data']['storage']['type'])
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (in development mode)"
}
```

Common error codes:
- `400`: Bad Request (missing files, invalid file types)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error (API errors, processing failures)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REPLICATE_API_TOKEN` | Your Replicate API token | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `MAX_FILE_SIZE` | Maximum file size in bytes | 10485760 (10MB) |
| `UPLOAD_PATH` | Upload directory path | ./uploads |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Optional |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Optional |

### File Requirements

- **Supported formats**: JPEG, JPG, PNG, WebP
- **Maximum file size**: 10MB (configurable)
- **Image requirements**: 
  - Person image should be a clear photo of a person
  - Garment image should be a clear photo of clothing item
  - Both images should be well-lit and high quality

## Storage Options

### Firebase Storage (Recommended for Production)

The backend automatically uses Firebase Storage when configured, providing:
- Scalable cloud storage
- Automatic file cleanup
- Public URLs for Replicate API
- Cost-effective storage solution

**Setup**: Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md)

### Local Storage (Development)

When Firebase is not configured, the backend falls back to local file serving:
- Files stored in `./uploads` directory
- Served via Express static middleware
- Suitable for development and testing

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Request throttling
- **File Validation**: Type and size checking
- **Input Sanitization**: Request validation
- **Firebase Security Rules**: Configurable storage access rules

## Development

### Project Structure
```
src/
├── config/
│   └── config.js          # Configuration management
├── controllers/
│   └── tryOnController.js # Request handlers
├── middleware/
│   ├── upload.js          # File upload handling
│   └── errorHandler.js    # Error handling
├── routes/
│   └── tryOnRoutes.js     # API routes
├── services/
│   ├── replicateService.js # Replicate API integration
│   └── firebaseService.js # Firebase Storage integration
└── server.js              # Main server file
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure your `.env` file exists and contains `REPLICATE_API_TOKEN`

2. **"Invalid file type"**
   - Check that uploaded files are JPEG, PNG, or WebP format

3. **"File too large"**
   - Reduce image file size or increase `MAX_FILE_SIZE` in config

4. **"Replicate API error"**
   - Verify your API token is correct and has sufficient credits
   - Check Replicate service status

5. **"Firebase not configured" warning**
   - This is normal if Firebase is not set up
   - The service will fall back to local storage
   - For production, follow the Firebase setup guide

6. **"Failed to upload image to storage"**
   - For Firebase: Check credentials and bucket permissions
   - For local: Ensure uploads directory exists and is writable

### Logs

The server logs all requests and errors. Check the console output for debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the error logs
- Check the [Firebase Setup Guide](./FIREBASE_SETUP.md)
- Open an issue on GitHub

## Acknowledgments

- [Replicate](https://replicate.com) for the IDM-VTON model
- [IDM-VTON](https://github.com/cuuupid/idm-vton) model creators
- [Firebase](https://firebase.google.com) for cloud storage services

