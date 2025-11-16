const vision = require('@google-cloud/vision');
const path = require('path');
const fs = require('fs');

let client;
// configure and initialize the Vision API client
try {
  // use explicit credentials file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log(`Using Service Account credentials from: ${credentialsPath}`);
    client = new vision.ImageAnnotatorClient({
      keyFilename: credentialsPath
    });
  } 
  // use default credentials (if gcloud is configured)
  else {
    console.log('Using default Google Cloud credentials...');
    client = new vision.ImageAnnotatorClient();
  }
} catch (error) {
  console.error('Error initializing Vision API client:', error.message);
  client = null;
}

// analyze image
async function analyzeImage(imagePath) {
  if (!client) {
    throw new Error('Vision API client not initialized');
  }

  // check if file exists
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  try {
    // perform label detection (identifies objects, scenes, etc.)
    const [labelResult] = await client.labelDetection(imagePath);
    const labels = labelResult.labelAnnotations || [];

    // if no labels detected, return null 
    if (labels.length === 0) {
      return {
        aiDetectedCategory: null,
        aiSuggestedName: null,
        aiTags: [],
        aiConfidence: 0,
        error: 'No labels detected in the image'
      };
    }

    // extract primary category
    const primaryLabel = labels[0];
    const aiDetectedCategory = primaryLabel.description || null;
    const aiConfidence = primaryLabel.score || 0;

    // extract suggested name
    const topLabels = labels.slice(0, 3); // get top 3 labels
    const aiSuggestedName = topLabels
      .map(label => label.description)
      .join(' ')
      .substring(0, 100); // limit length

    // extract all tags
    const aiTags = labels
      .filter(label => label.score && label.score > 0.5)
      .map(label => label.description)
      .slice(0, 10); // limit to top 10 tags

    return {
      aiDetectedCategory,
      aiSuggestedName,
      aiTags,
      aiConfidence,
      aiProcessedAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing image with Vision API:', error);
    
    // handle specific API errors
    if (error.code === 3) {
      throw new Error('Invalid image file format');
    } else if (error.code === 8) {
      throw new Error('Resource exhausted. API quota exceeded.');
    } else if (error.code === 16 || (error.message && error.message.includes('API key'))) {
      throw new Error('Vision API requires Service Account credentials, not API Key. Please set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON file. See TESTING_GUIDE.md for setup instructions.');
    } else if (error.code === 7 || (error.message && error.message.includes('permission'))) {
      throw new Error('Permission denied. Please check that your Service Account has Vision API enabled and proper permissions.');
    }
    
    throw new Error(`Vision API error: ${error.message}`);
  }
}

// analyze image from buffer
async function analyzeImageBuffer(imageBuffer) {
  if (!client) {
    throw new Error('Vision API client not initialized');
  }

  try {
    const [labelResult] = await client.labelDetection({
      image: { content: imageBuffer }
    });
    
    const labels = labelResult.labelAnnotations || [];

    if (labels.length === 0) {
      return {
        aiDetectedCategory: null,
        aiSuggestedName: null,
        aiTags: [],
        aiConfidence: 0,
        error: 'No labels detected in the image'
      };
    }

    const primaryLabel = labels[0];
    const aiDetectedCategory = primaryLabel.description || null;
    const aiConfidence = primaryLabel.score || 0;

    const topLabels = labels.slice(0, 3);
    const aiSuggestedName = topLabels
      .map(label => label.description)
      .join(' ')
      .substring(0, 100);

    const aiTags = labels
      .filter(label => label.score && label.score > 0.5)
      .map(label => label.description)
      .slice(0, 10);

    return {
      aiDetectedCategory,
      aiSuggestedName,
      aiTags,
      aiConfidence,
      aiProcessedAt: new Date()
    };
  } catch (error) {
    console.error('Error analyzing image buffer with Vision API:', error);
    throw new Error(`Vision API error: ${error.message}`);
  }
}

module.exports = {
  analyzeImage,
  analyzeImageBuffer
};

