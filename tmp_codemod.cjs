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
    
    // Check if there are buttons
    if (!content.includes('<button') && !content.includes('</button>')) return;
    
    // Replace <button to <Button variant="unstyled"
    // Also handle self closing buttons if any, though usually </button> exists
    // We only replace <button> and <button (with space or newline)
    content = content.replace(/<button\b/g, '<Button variant="unstyled"');
    content = content.replace(/<\/button>/g, '</Button>');
    
    // Fix lowercase motion.button -> motion.button (framermotion). Wait! If we have <motion.button, it becomes <motion.Button variant... which isn't right.
    // Framer motion uses <motion.button>. Let's keep motion.button as is, but it's replaced globally above. So let's revert motion.Button back to motion.button.
    content = content.replace(/<motion\.Button variant="unstyled"\b/g, '<motion.button');
    content = content.replace(/<\/motion\.Button>/g, '</motion.button>');
    
    // Check if we still have Button tags (non-motion)
    if (content.includes('<Button ') && !content.includes("import Button")) {
        // We need to inject the import
        const relativeToComponents = path.relative(path.dirname(filePath), path.join(__dirname, 'resources', 'js', 'Components'));
        const importPath = relativeToComponents.replace(/\\/g, '/');
        const importStatement = `import Button from '${importPath}/Button';\n`;
        
        // Find last import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ') && !lines[i].includes('Button from')) {
                lastImportIndex = i;
            }
        }
        
        if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importStatement);
            content = lines.join('\n');
        } else {
            content = importStatement + content;
        }
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed', filePath);
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
console.log("Codemod Complete");
