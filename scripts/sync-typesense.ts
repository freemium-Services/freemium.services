import { PrismaClient } from '@prisma/client';
import { Client as TypesenseClient } from 'typesense';
import * as dotenv from 'dotenv';
import { normalizeToolForSearch } from '../freemium_v2/src/lib/search';

dotenv.config();

const prisma = new PrismaClient();

const typesense = new TypesenseClient({
    nodes: [
        {
            host: process.env.TYPESENSE_HOST || 'localhost',
            port: parseInt(process.env.TYPESENSE_PORT || '8108'),
            protocol: process.env.TYPESENSE_PROTOCOL || 'http',
        },
    ],
    apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
    connectionTimeoutSeconds: 5,
});

const COLLECTION_NAME = 'search_entities';

/**
 * Configures the Typesense collection schema.
 * Includes model_config for auto-generating embeddings from the normalized text.
 */
async function setupCollection() {
    try {
        await typesense.collections(COLLECTION_NAME).delete();
        console.log(`Deleted existing collection: ${COLLECTION_NAME}`);
    } catch (err) {
        // Collection might not exist yet
    }

    const schema: any = {
        name: COLLECTION_NAME,
        fields: [
            { name: 'id', type: 'string' },
            { name: 'type', type: 'string', facet: true },
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'tags', type: 'string[]', facet: true },
            { name: 'operationalContext', type: 'string' },
            { name: 'popularityScore', type: 'float' },
            { name: 'readinessScore', type: 'float' },
            {
                name: 'embedding',
                type: 'float[]',
                embed: {
                    from: ['embeddingText'],
                    model_config: {
                        model_name: 'ts/all-MiniLM-L6-v2', // Typesense built-in SOTA embedding model
                    },
                },
            },
            { name: 'embeddingText', type: 'string', index: false },
        ],
        default_sorting_field: 'popularityScore',
    };

    console.log(`Creating collection: ${COLLECTION_NAME}...`);
    await typesense.collections().create(schema);
}

async function sync() {
    console.log('🚀 Starting Typesense Synchronization Worker...');

    try {
        await setupCollection();

        // Fetch all tools and include categories for normalization
        const tools = await prisma.tool.findMany({
            include: {
                category: true,
            },
        });

        console.log(`Found ${tools.length} tools in database. Normalizing for search...`);

        const documents = tools.map((t) => {
            // Bridge Prisma model to UI interface for the normalization utility
            const toolForNormalization: any = {
                ...t,
                category: t.category.slug,
                license: t.license.toLowerCase().replace('_', '-'),
                starsCount: t.stars || 0,
                features: [], // Ensure features array exists if not in DB yet
                alternatives: [],
            };

            return normalizeToolForSearch(toolForNormalization);
        });

        console.log(`Importing ${documents.length} entities into Typesense...`);
        await typesense.collections(COLLECTION_NAME).documents().import(documents, { action: 'upsert' });

        console.log('✅ Typesense search index is now synchronized.');
    } catch (error) {
        console.error('❌ Sync worker failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sync();