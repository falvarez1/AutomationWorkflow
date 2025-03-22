// Simple script to fix the syntax error in AutomationWorkflow.jsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'AutomationWorkflow.jsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix the extra closing brace issue by replacing the specific problem section
// This replaces the problematic "})}                 })}" with just "})}"
content = content.replace(/\}\)\}\s+\}\)\}/g, '})}');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content);

console.log('Fixed syntax error in AutomationWorkflow.jsx');