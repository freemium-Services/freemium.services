const test = require('node:test');
const assert = require('node:assert');
const { mapToolToSearchEntry } = require('../builder');

test('mapToolToSearchEntry correctly transforms tool data', (t) => {
    const mockTool = {
        id: 'ollama',
        name: 'Ollama',
        category: 'ai-tools',
        description: '### Ollama\nRun **LLMs** locally with `one` command.',
        alternatives: ['vllm'],
        install: 'curl ...'
    };
    const lastmod = '2026-05-09';
    const isFeatured = true;

    const entry = mapToolToSearchEntry(mockTool, lastmod, isFeatured);

    // Check basic mapping
    assert.strictEqual(entry.slug, 'ollama');
    assert.strictEqual(entry.title, 'Ollama');
    assert.strictEqual(entry.category, 'ai-tools');
    assert.strictEqual(entry.lastmod, '2026-05-09');
    assert.strictEqual(entry.isFeatured, true);

    // Check markdown stripping logic
    // Expected: "Ollama Run LLMs locally with one command."
    assert.ok(!entry.description.includes('#'), 'Should strip headers');
    assert.ok(!entry.description.includes('*'), 'Should strip bold indicators');
    assert.ok(!entry.description.includes('`'), 'Should strip code ticks');
    assert.strictEqual(entry.description, ' Ollama Run LLMs locally with one command.');

    // Check array handling
    assert.deepStrictEqual(entry.alternatives, ['vllm']);
    assert.strictEqual(entry.install, 'curl ...');
});

console.log('🧪 Unit tests for index generation loaded.');