import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { TokenService } from '../services/tokenService';
import { CreateTokenSchema } from '../types';
import { z } from 'zod';

const app = new Hono();
const tokenService = new TokenService();

// Create token with integrated DBC config
app.post('/', zValidator('json', CreateTokenSchema), async (c) => {
  try {
    const tokenData = c.req.valid('json');
    const result = await tokenService.createToken(tokenData);
    
    return c.json({
      success: true,
      data: result,
      message: 'Token and DBC config created successfully'
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
    const launchpad = c.req.query('launchpad');
    
    // Validate launchpad parameter if provided
    if (launchpad && launchpad !== 'potlaunch' && launchpad !== 'cookedpad') {
      return c.json({
        success: false,
        message: 'Invalid launchpad value. Must be "potlaunch" or "cookedpad"'
      }, 400);
    }

    const activeParam = c.req.query('active');
    const tag = c.req.query('tag');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    
    let active: boolean | undefined = undefined;
    if (activeParam !== undefined) {
      const lower = activeParam.toLowerCase();
      if (lower === 'true' || lower === 'false') {
        active = lower === 'true';
      } else {
        return c.json({
          success: false,
          message: 'Invalid active value. Must be "true" or "false"'
        }, 400);
      }
    }
    
    let tokens;
    if (launchpad || activeParam !== undefined || (tag && tag.trim() !== '') || startDate || endDate) {
      tokens = await tokenService.getTokensFiltered(
        launchpad as 'potlaunch' | 'cookedpad', 
        active, 
        tag?.trim() || undefined,
        startDate,
        endDate
      );
    } else {
      tokens = await tokenService.getAllTokens();
    }
    
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
    
    if (!token) {
      return c.json({
        success: false,
        message: 'Token not found'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: token
    });
  } catch (error) {
    console.error('Error in get token by address route:', error);
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Search tokens
app.get('/search', async (c) => {
  try {
    const query = c.req.query('q');
    const owner = c.req.query('owner');
    const launchpad = c.req.query('launchpad');
    const activeParam = c.req.query('active');
    const tag = c.req.query('tag');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    
    if (!query || query.trim() === '') {
      return c.json({
        success: false,
        message: 'Search query is required'
      }, 400);
    }
    
    // Validate launchpad parameter if provided
    if (launchpad && launchpad !== 'potlaunch' && launchpad !== 'cookedpad') {
      return c.json({
        success: false,
        message: 'Invalid launchpad value. Must be "potlaunch" or "cookedpad"'
      }, 400);
    }

    let active: boolean | undefined = undefined;
    if (activeParam !== undefined) {
      const lower = activeParam.toLowerCase();
      if (lower === 'true' || lower === 'false') {
        active = lower === 'true';
      } else {
        return c.json({
          success: false,
          message: 'Invalid active value. Must be "true" or "false"'
        }, 400);
      }
    }
    
    const tokens = await tokenService.searchTokens(
      query.trim(), 
      owner, 
      launchpad, 
      active, 
      tag?.trim() || undefined,
      startDate,
      endDate
    );
    
    return c.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Error in search tokens route:', error);
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

// Get popular tokens - This must come before /:id to avoid route conflicts
app.get('/popular', async (c) => {
  try {
    const limitParam = c.req.query('limit');
    const launchpad = c.req.query('launchpad');
    const activeParam = c.req.query('active');
    const tag = c.req.query('tag');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return c.json({
        success: false,
        message: 'Limit must be a number between 1 and 100'
      }, 400);
    }
    
    // Validate launchpad parameter if provided
    if (launchpad && launchpad !== 'potlaunch' && launchpad !== 'cookedpad') {
      return c.json({
        success: false,
        message: 'Invalid launchpad value. Must be "potlaunch" or "cookedpad"'
      }, 400);
    }

    let active: boolean | undefined = undefined;
    if (activeParam !== undefined) {
      const lower = activeParam.toLowerCase();
      if (lower === 'true' || lower === 'false') {
        active = lower === 'true';
      } else {
        return c.json({
          success: false,
          message: 'Invalid active value. Must be "true" or "false"'
        }, 400);
      }
    }
    
    const popularTokens = await tokenService.getPopularTokens(
      limit,
      launchpad as 'potlaunch' | 'cookedpad',
      active,
      tag?.trim() || undefined,
      startDate,
      endDate
    );
    
    return c.json({
      success: true,
      data: popularTokens
    });
  } catch (error) {
    console.error('Error in get popular tokens route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

app.get('/holders/:mintAddress', async (c) => {
  try {
    const mintAddress = c.req.param('mintAddress');
    const holders = await tokenService.getHoldersByMintAddress(mintAddress);
    return c.json({ success: true, data: holders });
  } catch (error) {
    console.error('Error in get holders by mint address route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Get token by ID
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    if (!id || id.trim() === '') {
      return c.json({
        success: false,
        message: 'Token ID is required'
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

// Delete token
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    if (!id || id.trim() === '') {
      return c.json({
        success: false,
        message: 'Token ID is required'
      }, 400);
    }
    
    const result = await tokenService.deleteToken(id);
    
    return c.json({
      success: true,
      data: result,
      message: 'Token deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete token route:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

export default app;