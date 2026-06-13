const fs = require('fs');
const path = require('path');
const strip = require('strip-comments');

const rootDirs = [
    path.join(__dirname, 'bidfe', 'src'),
    path.join(__dirname, 'bidbe', 'src')
];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('dist') && !filePath.includes('build')) {
                results = results.concat(walk(filePath));
            }
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.css')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

let totalFiles = 0;
let modifiedFiles = 0;

rootDirs.forEach(rootDir => {
    const files = walk(rootDir);
    files.forEach(file => {
        totalFiles++;
        const content = fs.readFileSync(file, 'utf8');
        try {
            // keepProtected: keeps comments containing certain directives if needed, but we want to strip all
            const stripped = strip(content, { keepProtected: false });
            if (stripped !== content) {
                fs.writeFileSync(file, stripped, 'utf8');
                modifiedFiles++;
                console.log(`Stripped comments from: ${file}`);
            }
        } catch (e) {
            console.error(`Failed to strip comments from ${file}: ${e.message}`);
        }
    });
});

console.log(`\nDone. Processed ${totalFiles} files. Modified ${modifiedFiles} files.`);
