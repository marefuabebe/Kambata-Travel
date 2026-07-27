const { execSync } = require('child_process');

const git = '"C:\\Program Files\\Git\\bin\\git.exe"';

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (e) {
        return '';
    }
}

// 1. Reset all commits back to the initial commit
const log = run(`${git} log --oneline`);
const lines = log.split('\n');
const initialCommit = lines[lines.length - 1].split(' ')[0];

console.log('Resetting to initial commit:', initialCommit);
run(`${git} reset ${initialCommit}`);

// 2. Get all modified/untracked files individually
// -u shows ALL untracked files individually, not just directories
const status = run(`${git} status --porcelain -u`);
const files = status.split('\n').filter(Boolean).map(line => line.substring(3).trim());

console.log(`Found ${files.length} files to commit individually!`);

// 3. Helper to generate a meaningful commit message
function getCommitMessage(file) {
    const lower = file.toLowerCase();
    let prefix = 'chore';
    let scope = '';
    
    if (lower.startsWith('frontend/')) scope = '(frontend)';
    else if (lower.startsWith('server/')) scope = '(server)';
    else if (lower.startsWith('admin-portal/')) scope = '(admin)';
    
    let action = 'add';
    let target = file.split('/').pop();
    
    if (lower.includes('components/')) {
        prefix = 'feat';
        action = 'implement UI component';
    } else if (lower.includes('app/')) {
        prefix = 'feat';
        action = 'build page view for';
        const parts = lower.split('/');
        let pageName = parts[parts.length - 2];
        if (pageName === 'app') pageName = 'home';
        target = pageName;
    } else if (lower.includes('models/')) {
        prefix = 'feat';
        action = 'define database schema for';
    } else if (lower.includes('controllers/')) {
        prefix = 'feat';
        action = 'implement API controller for';
    } else if (lower.includes('routes/')) {
        prefix = 'feat';
        action = 'setup API routes for';
    } else if (lower.includes('services/')) {
        prefix = 'feat';
        action = 'implement business logic service for';
    } else if (lower.includes('hooks/')) {
        prefix = 'feat';
        action = 'add custom React hook';
    } else if (lower.includes('context/')) {
        prefix = 'feat';
        action = 'implement state management context for';
    } else if (lower.endsWith('.css')) {
        prefix = 'style';
        action = 'add styling for';
    } else if (lower.endsWith('package.json')) {
        prefix = 'chore';
        action = 'configure dependencies in';
    }
    
    return `${prefix}${scope}: ${action} ${target}`;
}

// 4. Commit each file individually!
for (const file of files) {
    // Only commit actual files, avoid edge cases
    const msg = getCommitMessage(file);
    run(`${git} add "${file}"`);
    run(`${git} commit -m "${msg}"`);
}

console.log('All individual commits completed successfully!');
