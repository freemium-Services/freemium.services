const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const faqsPath = path.join(__dirname, '..', 'data', 'faqs.json');

async function generateFAQs(topic, categoryId, count) {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set. Please set the environment variable.');
    process.exit(1);
  }

  console.log(`🤖 Generating ${count} FAQs for topic: ${topic} (Category: ${categoryId})...`);

  const prompt = `
    You are an expert technical writer and SEO specialist for Freemium.Services, a directory of open-source and self-hosted tools.
    Generate ${count} high-intent, SEO-optimized "People Also Ask" style FAQs about the topic: "${topic}".
    The answers should be technical, authoritative, and mention 2026 tech trends, DePIN, or self-hosting where relevant.
    Do not use generic AI filler. Keep answers concise (1-2 paragraphs max).
    
    Return the response ONLY as a JSON array of objects with "q", "a", and "category" properties.
    The "category" property MUST be exactly "${categoryId}".
    Example: [{"q": "What is self-hosting?", "a": "Self-hosting is...", "category": "${categoryId}"}]
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    const newFaqs = JSON.parse(resultText);
    
    let existingFaqs = [];
    if (fs.existsSync(faqsPath)) {
      existingFaqs = JSON.parse(fs.readFileSync(faqsPath, 'utf8'));
    }
    
    const combinedFaqs = [...existingFaqs, ...newFaqs];
    fs.writeFileSync(faqsPath, JSON.stringify(combinedFaqs, null, 2));
    
    console.log(`✅ Successfully generated and appended ${newFaqs.length} FAQs to data/faqs.json`);
    console.log(`Total FAQs: ${combinedFaqs.length}`);
    
  } catch (error) {
    console.error('❌ Failed to generate FAQs:', error);
  }
}

const topic = process.argv[2];
const categoryId = process.argv[3] || 'global';
const count = parseInt(process.argv[4]) || 10;

if (!topic) {
  console.log('Usage: node scripts/gen_faqs.js "<topic>" "<categoryId>" [count]');
  process.exit(1);
}

generateFAQs(topic, categoryId, count);
