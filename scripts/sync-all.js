const { execSync } = require('child_process');

const REMOTES = ['origin', 'gitlab', 'gitlab-v2'];
const BRANCH = 'main';

console.log('🔄 Starting multi-remote synchronization...');

try {
    // 1. Pull latest from origin
    console.log(`\n📥 Pulling latest from origin/${BRANCH}...`);
    execSync(`git pull origin ${BRANCH} --rebase`, { stdio: 'inherit' });

    // 2. Push to all remotes
    for (const remote of REMOTES) {
        try {
            console.log(`\n🚀 Pushing to ${remote}/${BRANCH}...`);
            execSync(`git push ${remote} ${BRANCH}`, { stdio: 'inherit' });
            console.log(`✅ Successfully synced with ${remote}`);
        } catch (e) {
            console.error(`❌ Failed to push to ${remote}. You may need to resolve conflicts manually.`);
        }
    }

    console.log('\n✨ Multi-remote sync complete!');
} catch (e) {
    console.error('\n🚨 Sync failed during the pull/rebase phase. Please resolve conflicts manually.');
    process.exit(1);
}
