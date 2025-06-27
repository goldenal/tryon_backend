# Firebase Storage Setup Guide

This guide will help you set up Firebase Storage for the Virtual Try-On backend.

## Prerequisites

1. A Google account
2. Node.js and npm installed
3. Basic knowledge of Firebase Console

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "tryon-backend")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firebase Storage

1. In your Firebase project, click on "Storage" in the left sidebar
2. Click "Get started"
3. Choose a location for your storage bucket (select the closest to your users)
4. Choose security rules:
   - For development: Start in test mode
   - For production: Use custom rules
5. Click "Done"

## Step 3: Create a Service Account

1. In Firebase Console, go to Project Settings (gear icon)
2. Click on the "Service accounts" tab
3. Click "Generate new private key"
4. Choose "Firebase Admin SDK"
5. Click "Generate key"
6. Download the JSON file (keep it secure!)

## Step 4: Configure Environment Variables

1. Copy the downloaded service account JSON content
2. Create a `.env` file in your project root (if not exists)
3. Add the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id_from_json
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_from_json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key from JSON\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email_from_json
FIREBASE_CLIENT_ID=your_client_id_from_json
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_x509_cert_url_from_json
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
```

## Step 5: Update Storage Rules (Optional)

For production, update your Firebase Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files
    match /uploads/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 6: Test the Integration

1. Start your server:
   ```bash
   npm run dev
   ```

2. Check the health endpoint:
   ```bash
   curl http://localhost:3000/api/tryon/health
   ```

3. You should see Firebase storage information in the response:
   ```json
   {
     "success": true,
     "message": "Try-on service is healthy",
     "storage": {
       "type": "firebase",
       "name": "your-project-id.appspot.com",
       "projectId": "your-project-id",
       "configured": true
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **"Firebase not configured" warning**
   - Check that all Firebase environment variables are set
   - Verify the private key format (should include `\n` for line breaks)

2. **"Permission denied" errors**
   - Ensure your service account has Storage Admin permissions
   - Check Firebase Storage rules

3. **"Bucket not found" errors**
   - Verify the `FIREBASE_STORAGE_BUCKET` is correct
   - Ensure Firebase Storage is enabled in your project

4. **"Invalid private key" errors**
   - Make sure the private key includes the full PEM format
   - Check that `\n` characters are preserved in the environment variable

### Security Best Practices

1. **Never commit your service account key to version control**
2. **Use environment variables for all sensitive data**
3. **Set up proper Firebase Storage rules for production**
4. **Regularly rotate your service account keys**
5. **Monitor Firebase usage and costs**

### Cost Optimization

1. **Set up Firebase Storage lifecycle rules** to automatically delete old files
2. **Monitor storage usage** in Firebase Console
3. **Consider implementing file cleanup** after processing
4. **Use appropriate storage classes** for your use case

## Example Service Account JSON Structure

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com"
}
```

## Next Steps

After setting up Firebase Storage:

1. Test file uploads with the API
2. Monitor Firebase Console for uploads
3. Set up proper error handling and retry logic
4. Implement file cleanup strategies
5. Consider setting up Firebase Storage triggers for additional processing

## Support

If you encounter issues:

1. Check Firebase Console logs
2. Verify environment variables
3. Test with Firebase CLI
4. Review Firebase documentation
5. Check the application logs for detailed error messages 