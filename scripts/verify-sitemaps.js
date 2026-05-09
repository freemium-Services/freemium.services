const fs = require('fs');
const path = require('path');
const https = require('https');

const publicDir = path.join(__dirname, '..', 'public');
const robotsPath = path.join(publicDir, 'robots.txt');

async function checkUrlStatus(url) {
    return new Promise(resolve => {
        const options = {
            method: 'HEAD',
            timeout: 5000 // 5 seconds timeout
        };

        const req = https.request(url, options, (res) => {
            resolve(res.statusCode);
            res.destroy(); // Important to close the connection
        });

        req.on('timeout', () => {
            req.destroy();
            resolve('TIMEOUT');
        });

        req.on('error', (e) => {
            // console.error(`  HTTP Request Error for ${url}: ${e.message}`); // Log only if needed for debugging
            resolve('NETWORK_ERROR');
        });

        req.end();
    });
}

async function verifySitemaps() {
    if (!fs.existsSync(robotsPath)) {
        console.error(`❌ robots.txt not found at ${robotsPath}. Ensure you have run 'npm run build' first.`);
        process.exit(1);
    }

    const content = fs.readFileSync(robotsPath, 'utf8');
    // Find all lines starting with Sitemap: (case-insensitive)
    const sitemapLines = content.match(/^Sitemap:\s*(.*)/gmi);

    if (!sitemapLines) {
        console.warn("⚠️ No 'Sitemap:' entries found in robots.txt.");
        return;
    }

    const pathsToVerify = sitemapLines.map(line => {
        const url = line.replace(/^Sitemap:\s*/i, '').trim();
        // Extract the path (e.g., /sitemap.xml) by removing the protocol and domain
        return url.replace(/^https?:\/\/[^\/]+/, '');
    });

    console.log(`🔍 Auditing ${pathsToVerify.length} sitemap references from robots.txt...\n`);

    let missingCount = 0;
    pathsToVerify.forEach(sitemapPath => {
        const relativePath = sitemapPath.startsWith('/') ? sitemapPath.slice(1) : sitemapPath;
        const fullPath = path.join(publicDir, relativePath);

        if (fs.existsSync(fullPath)) {
            console.log(`✅ [FOUND]   ${sitemapPath}`);
        } else {
            console.error(`❌ [MISSING] ${sitemapPath} (Expected at ${fullPath})`);
            missingCount++;
        }
    });

    if (missingCount > 0) {
        console.error(`\n🚨 Audit Failed: ${missingCount} sitemap file(s) are missing from the build output.`);
        process.exit(1);
    }
    console.log(`\n🎉 File Existence Audit Passed: All sitemaps listed in robots.txt are present in the public directory.`);

    // NEW: Sitemap Depth Check (HTTP status)
    console.log('\n🌐 Starting Sitemap Depth Check (HTTP Status for URLs within sitemaps)...');
    let httpErrors = 0;

    const sitemapFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.xml') && f !== 'sitemap-index.xml');

    for (const sitemapFile of sitemapFiles) {
        const sitemapContent = fs.readFileSync(path.join(publicDir, sitemapFile), 'utf8');
        const locMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);

        if (locMatches && locMatches.length > 0) {
            console.log(`\n📄 Checking URLs in ${sitemapFile} (${locMatches.length} URLs)...`);
            for (const loc of locMatches) {
                const url = loc.replace('<loc>', '').replace('</loc>', '');
                const status = await checkUrlStatus(url);
                if (status === 200) {
                    // console.log(`  ✅ [200 OK] ${url}`); // Too verbose for large sitemaps
                } else {
                    console.error(`  ❌ [${status || 'ERROR'}] ${url}`);
                    httpErrors++;
                }
                await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to avoid hammering the server
            }
        } else {
            console.log(`\n📄 No URLs found in ${sitemapFile}.`);
        }
    }

    if (httpErrors > 0) {
        console.error(`\n🚨 Sitemap Depth Check FAILED: ${httpErrors} URL(s) returned non-200 status.`);
        process.exit(1);
    } else {
        console.log(`\n🎉 Sitemap Depth Check PASSED: All sitemap URLs returned 200 OK.`);
    }
}

verifySitemaps().catch(err => {
    console.error('❌ Sitemap verification failed:', err);
    process.exit(1);
});