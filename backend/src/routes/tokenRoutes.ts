import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { TokenService } from '../services/tokenService';
import { CreateTokenSchema } from '../types';
import { z } from 'zod';

const app = new Hono();
const tokenService = new TokenService();

// Create token
app.post('/', zValidator('json', CreateTokenSchema), async (c) => {
  try {
    const tokenData = c.req.valid('json');
    const result = await tokenService.createToken(tokenData);
    
    return c.json({
      success: true,
      data: result,
      message: 'Token created successfully'
    }, 201);
  } catch (error) {
    console.error('Error in create token route:', error);
    
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

// Get all tokens
app.get('/', async (c) => {
  try {
    const tokens = await tokenService.getAllTokens();
    
    return c.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Error in get all tokens route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Get token by address - This must come before /:id to avoid route conflicts
app.get('/mint/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    if (!address || address.trim() === '') {
      return c.json({
        success: false,
        message: 'Token address is required'
      }, 400);
    }
    
    const token = await tokenService.getTokenByAddress(address);
    
    return c.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error in get token by address route:', error);
    
    if (error instanceof Error && error.message === 'Token not found') {
      return c.json({
        success: false,
        message: 'Token not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Get token by owner
app.get('/address/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    if (!address || address.trim() === '') {
      return c.json({
        success: false,
        message: 'Owner address is required'
      }, 400);
    }

    const tokens = await tokenService.getTokensByOwner(address);
    
    return c.json({
      success: true,
      data: tokens
    }); 
  } catch (error) {
    console.error('Error in get tokens by owner route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Get token by ID
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'Invalid token ID'
      }, 400);
    }
    
    const token = await tokenService.getTokenById(id);
    
    return c.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error in get token by ID route:', error);
    
    if (error instanceof Error && error.message === 'Token not found') {
      return c.json({
        success: false,
        message: 'Token not found'
      }, 404);
    }
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Delete all tokens
app.delete('/all', async (c) => {
  try {
    const result = await tokenService.deleteAllTokens();
    await tokenService.deleteAllAllocations();
    return c.json({
      success: true,
      data: result,
      message: 'All tokens deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete all tokens route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

export default app; 