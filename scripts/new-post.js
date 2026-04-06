import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const title = process.argv.slice(2).join(' ');

if (!title) {
    console.error('Error: Please provide a title for the new post.');
    console.error('Usage: npm run new-post "Post Title"');
    process.exit(1);
}

const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const date = new Date().toISOString().split('T')[0];
const filepath = path.join(__dirname, '..', 'content', 'posts', `${slug}.md`);

const template = `---
title: ${title}
date: ${date}
tags: []
description: ""
---

`;

if (fs.existsSync(filepath)) {
    console.error(`Error: Post already exists at ${filepath}`);
    process.exit(1);
}

fs.mkdirSync(path.dirname(filepath), { recursive: true });
fs.writeFileSync(filepath, template, 'utf8');

console.log(`\n✅ Created new post: ${filepath}\n`);

// Attempt to open the file in VS Code or default editor
try {
    if (process.env.TERM_PROGRAM === 'vscode') {
        exec(`code "${filepath}"`);
    } else {
        // Attempt fallback to a generic open command, or editor
        const editor = process.env.EDITOR || process.env.VISUAL;
        if (editor) {
            exec(`${editor} "${filepath}"`);
        } else {
            // Just print that it's ready for editing
            console.log(`You can now edit this file in your preferred editor.`);
        }
    }
} catch (err) {
    // Ignore errors for opening
    console.log(`You can now edit this file in your preferred editor.`);
}
