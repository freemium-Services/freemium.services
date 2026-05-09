import { PrismaClient, License, Level } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Freemium.Services Operational Graph...');

    // 1. Create Core Categories
    const aiCategory = await prisma.category.upsert({
        where: { slug: 'ai-tools' },
        update: {},
        create: {
            slug: 'ai-tools',
            name: 'AI & Machine Learning',
            description: 'Local LLMs, inference engines, and RAG frameworks.',
        },
    });

    // 2. Seed Flagship Tool: Ollama
    const ollama = await prisma.tool.upsert({
        where: { slug: 'ollama' },
        update: {},
        create: {
            slug: 'ollama',
            name: 'Ollama',
            emoji: '🦙',
            description: 'Run large language models locally.',
            license: License.OPEN_SOURCE,
            selfHostable: true,
            github: 'https://github.com/ollama/ollama',
            stars: 95000,
            ramMin: 8192,
            gpuRequired: true,
            maintenanceLevel: Level.LOW,
            scalingDifficulty: 2,
            categoryId: aiCategory.id,
            contentPage: {
                create: {
                    slug: 'ollama-details',
                    type: 'TOOL',
                    blocks: {
                        create: [
                            {
                                type: 'hero',
                                order: 0,
                                data: {
                                    title: 'Ollama: The Local AI Standard',
                                    subtitle: 'Private LLM inference on your own hardware.',
                                    ctaText: 'Download CLI',
                                },
                            },
                            {
                                type: 'operational_specs',
                                order: 1,
                                data: {
                                    ramMin: 8192,
                                    gpuRequired: true,
                                    scalingDifficulty: 2,
                                },
                            },
                        ],
                    },
                },
            },
        },
    });

    console.log('✅ Seed complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });