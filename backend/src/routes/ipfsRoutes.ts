import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { IPFSService } from '../services/ipfsService';
import { UploadMetadataSchema } from '../types';
import { z } from 'zod';

const app = new Hono();

// Environment variables for Filebase (optional - IPFS routes will return errors if not configured)
const FILEBASE_API_KEY = process.env.FILEBASE_API_KEY;
const FILEBASE_API_SECRET = process.env.FILEBASE_API_SECRET;
const FILEBASE_BUCKET_NAME = process.env.FILEBASE_BUCKET_NAME;

// Only initialize IPFS service if all required env vars are present
const ipfsService = (FILEBASE_API_KEY && FILEBASE_API_SECRET && FILEBASE_BUCKET_NAME)
  ? new IPFSService(FILEBASE_API_KEY, FILEBASE_API_SECRET, FILEBASE_BUCKET_NAME)
  : null;

// Upload image file
app.post('/upload-image', async (c) => {
  if (!ipfsService) {
    return c.json({
      success: false,
      message: 'IPFS service is not configured. Please set FILEBASE_API_KEY, FILEBASE_API_SECRET, and FILEBASE_BUCKET_NAME environment variables'
    }, 503);
  }

  try {
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File;
    const fileName = formData.get('fileName') as string;

    if (!imageFile) {
      return c.json({
        success: false,
        message: 'Image file is required'
      }, 400);
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return c.json({
        success: false,
        message: 'File must be an image'
      }, 400);
    }

    const cid = await ipfsService.uploadImage(imageFile, fileName);

    return c.json({
      success: true,
      data: { imageUri: cid },
      message: 'Image uploaded successfully'
    }, 201);
  } catch (error) {
    console.error('Error in upload image route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Upload metadata JSON
app.post('/upload-metadata', zValidator('json', UploadMetadataSchema), async (c) => {
  if (!ipfsService) {
    return c.json({
      success: false,
      message: 'IPFS service is not configured. Please set FILEBASE_API_KEY, FILEBASE_API_SECRET, and FILEBASE_BUCKET_NAME environment variables'
    }, 503);
  }

  try {
    const metadataData = c.req.valid('json');
    
    const cid = await ipfsService.uploadTokenMetadata(
      metadataData.name,
      metadataData.symbol,
      metadataData.imageUri,
      metadataData.bannerUri,
      metadataData.description,
      metadataData.website || '',
      metadataData.twitter || '',
      metadataData.telegram || ''
    );

    return c.json({
      success: true,
      data: { imageUri: cid },
      message: 'Metadata uploaded successfully'
    }, 201);
  } catch (error) {
    console.error('Error in upload metadata route:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        message: 'Validation error: ' + error.errors.map(e => e.message).join(', ')
      }, 400);
    }
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Health check endpoint
app.get('/health', async (c) => {
  return c.json({
    success: true,
    message: ipfsService ? 'IPFS service is running' : 'IPFS service is not configured',
    configured: !!ipfsService
  });
});

export default app;
