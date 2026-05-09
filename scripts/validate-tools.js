const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', 'data', 'tools.json');

// These categories are hardcoded in builder.js, so we need to ensure tools reference them.
const CATEGORY_IDS = [
    'ai-tools', 'automation-tools', 'self-hosting', 'rag-tools', 'ai-agents',
    'developer-tools', 'vector-databases', 'cli-tools', 'assistants', 'open-source'
];

let toolsData = {};
try {
    toolsData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
} catch (e) {
    console.error('❌ Validation Failed: Could not load tools.json', e);
    process.exit(1);
}

let errorsFound = 0;

function validateTool(tool) {
    const required = ['id', 'name', 'category', 'description', 'features', 'faq', 'alternatives', 'license', 'emoji'];
    for (const field of required) {
        if (!tool[field]) {
            console.error(`❌ Tool Validation Error: Missing required field '${field}' in tool '${tool.id || 'unknown'}'`);
            errorsFound++;
        }
    }

    // Ensure alternatives is a non-empty array
    if (!Array.isArray(tool.alternatives) || tool.alternatives.length === 0) {
        console.error(`❌ Tool Validation Error: Tool '${tool.id}' must have an 'alternatives' array with at least one entry.`);
        errorsFound++;
    } else {
        // Check for at least one alternative that actually exists in toolsData
        const hasValidAlt = tool.alternatives.some(altId => toolsData[altId]);
        if (!hasValidAlt) {
            console.error(`❌ Tool Validation Error: Tool '${tool.id}' has no valid alternatives present in tools.json. Alternatives: ${tool.alternatives.join(', ')}`);
            errorsFound++;
        }
    }

    // Ensure features is an array with at least 3 items for SEO depth
    if (!Array.isArray(tool.features) || tool.features.length < 3) {
        console.error(`❌ Tool Validation Error: Tool '${tool.id}' must have at least 3 features for SEO depth.`);
        errorsFound++;
    }

    // Ensure category exists
    if (!CATEGORY_IDS.includes(tool.category)) {
        console.error(`❌ Tool Validation Error: Tool '${tool.id}' references unknown category '${tool.category}'. Valid categories are: ${CATEGORY_IDS.join(', ')}`);
        errorsFound++;
    }

    // Ensure description meets word count (as per CONTRIBUTING.md)
    const wordCount = tool.description.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 2000) {
        console.warn(`⚠️ Tool Validation Warning: Description for '${tool.id}' is only ${wordCount} words. (Required: 2000+)`);
    }

    // License standardization check
    const VALID_LICENSES = ['MIT', 'Apache 2.0', 'GPL-3.0', 'AGPL-3.0', 'BSD', 'MIT / Unlicense'];
    if (tool.license && !VALID_LICENSES.some(l => tool.license.includes(l))) {
        console.warn(`⚠️ Tool Validation Warning: Tool '${tool.id}' uses non-standard license: ${tool.license}`);
    }
}

function validateCategories() {
    const toolCategories = new Set(Object.values(toolsData).map(t => t.category));
    CATEGORY_IDS.forEach(catId => {
        if (!toolCategories.has(catId)) {
            console.warn(`⚠️ Category Validation Warning: Category '${catId}' defined in builder.js has no associated tools in tools.json.`);
        }
    });
}

console.log('🔍 Starting tools.json validation...');

// Validate all tools
Object.values(toolsData).forEach(validateTool);

// Validate categories
validateCategories();

if (errorsFound > 0) {
    console.error(`\n🚨 Validation Failed: Found ${errorsFound} critical error(s) in tools.json.`);
    process.exit(1);
} else {
    console.log('\n✅ tools.json validation passed with no critical errors.');
    process.exit(0);
}