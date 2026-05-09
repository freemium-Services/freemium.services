const fs = require('fs');
const path = require('path');
const https = require('https');

// Usage: node scripts/ingest.js <github-repo-path> <category>
// Example: node scripts/ingest.js n8n-io/n8n automation-tools

const repoPath = process.argv[2];
const category = process.argv[3];

if (!repoPath || !category) {
  console.error("Usage: node scripts/ingest.js <owner/repo> <category>");
  console.error("Example: node scripts/ingest.js langgenius/dify ai-tools");
  process.exit(1);
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, but prevents rate limiting
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const toolsDataPath = path.join(__dirname, '..', 'data', 'tools.json');
const tempPath = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

const githubHeaders = {
  'User-Agent': 'Freemium.Services-Ingest-Bot/1.0',
  'Accept': 'application/vnd.github.v3+json'
};

if (GITHUB_TOKEN) {
  githubHeaders['Authorization'] = `token ${GITHUB_TOKEN}`;
}

function fixJson(str) {
  // Remove markdown code blocks if present
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();

  // Remove trailing commas in objects and arrays
  // This handles ,} and ,]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Remove potential non-json content before/after the main block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function fetchGithubData(repo) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}`,
      headers: githubHeaders
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API Error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      // Retry on Rate Limit (429) or Server Errors (5xx)
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        const delay = Math.pow(2, i) * 2000; // Exponential backoff: 2s, 4s, 8s
        console.warn(`⚠️ API responded with ${response.status}. Retrying in ${delay}ms (Attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function generateAIContent(repoData, cat) {
  const maxAttempts = 3;
  let attempts = 0;
  let lastResult;

  while (attempts < maxAttempts) {
    attempts++;
    const prompt = `
    You are an expert technical writer and SEO specialist. 
    Write a comprehensive, 2000+ word deep-dive for a technical directory about the GitHub project "${repoData.full_name}".
    ${attempts > 1 ? `\nIMPORTANT: The previous response was too short. You MUST provide a much more detailed "description" that is strictly over 2000 words long. Dive deeper into technical internals, comparison details, and deployment nuances.` : ''}
    
    Target Category: ${cat}
    Repository Description: ${repoData.description}
    Stars: ${repoData.stargazers_count}
    License: ${repoData.license?.name || 'Open Source'}

    Requirements:
    1. DESCRIPTION: Write a long, insightful, and unique description (2000+ words). 
       Focus on:
       - What specific problem it solves in the 2026 tech landscape.
       - Architectural benefits (it's built in ${repoData.language || 'software'}).
       - Why it's a superior alternative to commercial SaaS.
       - Real-world deployment scenarios and DePIN potential.
       - Use a professional, authoritative, and visionary tone.
    2. FEATURES: Provide 5 high-impact, technical features.
    3. FAQ: Provide 2 technical FAQs with detailed, multi-sentence answers.
    4. ALTERNATIVES: Suggest 3 similar open-source or commercial alternatives.
    5. EMOJI: Choose a relevant single emoji.
    6. INSTALL: Provide the most common docker run command or standard install CLI.

    OUTPUT FORMAT: You MUST return ONLY a valid JSON object matching this schema:
    {
      "id": "${repoData.name.toLowerCase()}",
      "name": "${repoData.name}",
      "category": "${cat}",
      "emoji": "string",
      "license": "string",
      "stars": number,
      "description": "string (the full 2000+ word content)",
      "install": "string",
      "features": ["string", "string", "string", "string", "string"],
      "alternatives": ["string", "string", "string"],
      "faq": [
        {"q": "string", "a": "string"},
        {"q": "string", "a": "string"}
      ],
      "ogImage": "/og/${repoData.name.toLowerCase()}-og.svg"
    }
  `;

    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorBody}`);
    }

    const responseText = await response.text();
    fs.writeFileSync(path.join(tempPath, 'last_gemini_content_raw.json'), responseText);

    const json = JSON.parse(responseText);
    if (!json.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("Invalid response structure from Gemini API");
    }

    const toolContent = json.candidates[0].content.parts[0].text;
    fs.writeFileSync(path.join(tempPath, 'last_tool_json_extracted.json'), toolContent);

    try {
      const result = JSON.parse(fixJson(toolContent));
      lastResult = result;
      const wordCount = result.description.split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount >= 2000) {
        return result;
      }
      console.warn(`\x1b[33m⚠️ Attempt ${attempts}: Generated description for '${result.name}' is only ${wordCount} words. (Requirement: 2000+). Retrying...\x1b[0m`);
    } catch (e) {
      if (attempts === maxAttempts) {
        console.error("❌ Failed to parse JSON even after fix attempt. Content saved to temp/last_tool_json_extracted.json");
        throw e;
      }
      console.warn(`⚠️ Attempt ${attempts}: JSON parsing failed. Retrying...`);
    }
  }

  return lastResult;
}

async function translateText(text, targetLang) {
  if (!GEMINI_API_KEY) return text;

  const prompt = `Translate the following technical software description into ${targetLang}. 
  Keep technical terms like "Docker", "SaaS", "RAG", "LLM", "iPaaS", "DePIN" in English if they are commonly used that way in ${targetLang}. 
  Return ONLY the translated text.
  
  Text: ${text}`;

  try {
    const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const responseText = await response.text();
    fs.writeFileSync(path.join(tempPath, 'last_gemini_translation_raw.json'), responseText);

    const json = JSON.parse(responseText);
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
  } catch (e) {
    return text;
  }
}

function generateMockContent(repoData, cat) {
  // In a full production script, this would hit the OpenAI/Claude API
  // Prompt: "You are an expert technical writer. Write an 800-word SEO description, features, and FAQ for ${repoData.name}..."

  return {
    id: repoData.name.toLowerCase(),
    name: repoData.name,
    category: cat,
    emoji: "🚀", // Placeholder
    license: repoData.license ? repoData.license.name : "Open Source",
    stars: repoData.stargazers_count,
    lastUpdated: new Date(repoData.updated_at).toISOString().split('T')[0],
    description: `${repoData.description || repoData.name}. [LLM GENERATED CONTENT HERE: This section should be expanded programmatically via an LLM API to be 800+ words covering use-cases, architecture, and value proposition.]`,
    install: "docker-compose up -d", // Placeholder
    features: [
      "Auto-generated feature 1 based on README",
      "Auto-generated feature 2 based on README",
      "Auto-generated feature 3 based on README"
    ],
    alternatives: [],
    faq: [
      {
        q: `What is the primary use case for ${repoData.name}?`,
        a: "[LLM GENERATED ANSWER]"
      },
      {
        q: `Can I self-host ${repoData.name}?`,
        a: `Yes, ${repoData.name} can be self-hosted via its official Docker images.`
      }
    ]
  };
}

async function run() {
  try {
    console.log(`🔍 Fetching repository data for: ${repoPath}...`);
    const repoData = await fetchGithubData(repoPath);
    console.log(`✅ Found: ${repoData.name} (${repoData.stargazers_count} stars, ${repoData.license ? repoData.license.name : 'No License'})`);

    let newTool;
    if (GEMINI_API_KEY) {
      console.log(`🤖 Generating AI-powered SEO content for ${repoData.name} via Gemini...`);
      newTool = await generateAIContent(repoData, category);
    } else {
      console.log(`🤖 Generating mock content for ${repoData.name}...`);
      newTool = generateMockContent(repoData, category);
    }

    // Read existing tools
    let toolsData = {};
    if (fs.existsSync(toolsDataPath)) {
      toolsData = JSON.parse(fs.readFileSync(toolsDataPath, 'utf8'));
    }

    // Insert new tool
    if (toolsData[newTool.id]) {
      console.warn(`⚠️ Tool '${newTool.id}' already exists. Overwriting...`);
    }
    toolsData[newTool.id] = newTool;

    // Save
    fs.writeFileSync(toolsDataPath, JSON.stringify(toolsData, null, 2));
    console.log(`🎉 Successfully added '${newTool.id}' to data/tools.json!`);
    console.log(`👉 Next step: Open data/tools.json to refine the LLM placeholders, then run 'npm run build'.`);

  } catch (error) {
    console.error("❌ Ingestion Failed:", error.message);
  }
}

if (require.main === module) {
  run();
}

module.exports = { translateText, generateAIContent, fetchGithubData };
