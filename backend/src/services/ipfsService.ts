import { ObjectManager } from '@filebase/sdk';
import { type TokenMetadata } from '../types';

export class IPFSService {
    private objectManager: ObjectManager;

    constructor(apiKey: string, apiSecret: string, bucketName: string) {
        this.objectManager = new ObjectManager(apiKey, apiSecret, {
            bucket: bucketName
        });
    }

    // create metadata JSON from token config
    private createMetadataJson(
        name: string,
        symbol: string,
        description: string,
        imageUri: string,
        bannerUri: string,
        website: string,
        twitter: string,
        telegram: string
    ): TokenMetadata {
        const metadata = {
            name: name,
            symbol: symbol,
            description: description,
            image: imageUri,
            banner: bannerUri,
            website: website,
            twitter: twitter,
            telegram: telegram,
        };

        return metadata;
    }

    // upload metadata JSON
    async uploadTokenMetadata(
        name: string,
        symbol: string,
        imageUri: string,
        bannerUri: string,
        description: string,
        website: string,
        twitter: string,
        telegram: string
    ): Promise<string> {
        const metadataJson = this.createMetadataJson(
            name,
            symbol,
            description,
            imageUri,
            bannerUri,
            website,
            twitter,
            telegram
        );

        try {
            // Generate a unique filename for the metadata
            const timestamp = Date.now();
            const fileName = `metadata/${symbol}_${timestamp}.json`;
            
            //@ts-ignore
            const uploadedObject = await this.objectManager.upload(
                fileName,
                Buffer.from(JSON.stringify(metadataJson))
            );
            
            // Extract IPFS hash from the uploaded object
            const ipfsHash = uploadedObject.cid;
            
            if (!ipfsHash) {
                throw new Error('No IPFS hash returned from upload');
            }
            
            console.log('ipfs hash:', ipfsHash);
            return ipfsHash;
        } catch (error) {
            console.error('Error uploading metadata:', error);
            throw new Error(`Failed to upload metadata: ${error}`);
        }
    }

    // upload image file to filebase
    async uploadImage(
        imageFile: File,
        fileName?: string
    ): Promise<string> {
        console.log('Uploading image to Filebase...');

        try {
            // Convert File to ArrayBuffer then to Buffer
            const arrayBuffer = await imageFile.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            
            // Use provided fileName or fallback to file.name
            const finalFileName = fileName || imageFile.name || 'image.png';
            
            // Generate a unique filename with timestamp
            const timestamp = Date.now();
            const uniqueFileName = `images/${timestamp}_${finalFileName}`;
            
            //@ts-ignore
            const uploadedObject = await this.objectManager.upload(
                uniqueFileName,
                imageBuffer
            );
            
            // Extract IPFS hash from the uploaded object
            const ipfsHash = uploadedObject.cid;
            
            if (!ipfsHash) {
                throw new Error('No IPFS hash returned from upload');
            }
            
            console.log('ipfs hash:', ipfsHash);
            return ipfsHash;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error(`Failed to upload image: ${error}`);
        }
    }
}