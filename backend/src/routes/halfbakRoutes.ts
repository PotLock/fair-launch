import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HalfbakService } from '../services/halfbakService';
import { z } from 'zod';
import { buildDbcConfigRequest, buildDeployTokenRequest } from '../lib/halfbak';
import { DbcConfigRequestSchema, DeployTokenRequestSchema } from '../types';
import type { DbcConfigRequestType, DeployTokenRequestType } from '../types';

const app = new Hono();
const halfbakService = new HalfbakService();

// Create DBC Configuration
app.post('/dbc-config', zValidator('json', DbcConfigRequestSchema), async (c) => {
  try {
    const requestData = c.req.valid('json') as DbcConfigRequestType;

    const dbcConfigRequest = buildDbcConfigRequest(requestData);

    const transaction = await halfbakService.createDbcConfig(dbcConfigRequest);

    return c.json({
      success: true,
      data: {
        dbcConfigKeypair: transaction.dbcConfigKeypair,
        transaction: transaction.dbcConfigTransaction,
        message: 'DBC configuration transaction created successfully'
      }
    }, 201);
  } catch (error) {
    console.error('Error in create DBC config route:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        message: 'Validation error: ' + error.errors.map(e => e.message).join(', ')
      }, 400);
    }
    
    // Handle Solana PublicKey errors
    if (error instanceof Error && error.message.includes('Invalid public key')) {
      return c.json({
        success: false,
        message: 'Invalid signer public key format'
      }, 400);
    }
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

// Deploy Token
app.post('/deploy-token', zValidator('json', DeployTokenRequestSchema), async (c) => {
  try {
    const requestData = c.req.valid('json') as DeployTokenRequestType;

    const deployTokenRequest = buildDeployTokenRequest(requestData);

    const result = await halfbakService.deployToken(deployTokenRequest);

    return c.json({
      success: true,
      data: {
        transaction: result.transaction,
        baseMint: result.baseMint,
        message: 'Token deployment transaction created successfully'
      }
    }, 201);
  } catch (error) {
    console.error('Error in deploy token route:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        message: 'Validation error: ' + error.errors.map(e => e.message).join(', ')
      }, 400);
    }
    
    // Handle Solana PublicKey errors
    if (error instanceof Error && error.message.includes('Invalid public key')) {
      return c.json({
        success: false,
        message: 'Invalid signer public key format'
      }, 400);
    }
    
    // Handle Keypair errors
    if (error instanceof Error && error.message.includes('Invalid secret key')) {
      return c.json({
        success: false,
        message: 'Invalid DBC config keypair format'
      }, 400);
    }
    
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, 500);
  }
});

export default app;
