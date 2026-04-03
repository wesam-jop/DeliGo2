const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, 'resources', 'js', 'Pages'),
    path.join(__dirname, 'resources', 'js', 'Components')
];

function processFile(filePath) {
    if (path.basename(filePath) === 'Button.jsx') return;

    let original = fs.readFileSync(filePath, 'utf8');
    let content = original;
    
    // Fix imports that look like: import Button from '/Button';
    content = content.replace(/import Button from '\/Button';/g, "import Button from './Button';");
    // Also catch: import Button from 'Button'; (if any)
    content = content.replace(/import Button from 'Button';/g, "import Button from './Button';");
    
    // Check if there's any imports like import Button from 'Dashboard/Button'; instead of '../Button'
    // I will just let the script fix the ones starting with /
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed imports in', filePath);
    }
}

function processAllFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processAllFiles(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

targetDirs.forEach(dir => processAllFiles(dir));
console.log("Import Fix Complete");
