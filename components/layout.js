import sidebar from './sidebar.js';
import fs from 'fs';
import path from 'path';

let catSvgInline = '';
try {
    const svgPath = path.join(process.cwd(), 'images', 'cat.svg');
    let raw = fs.readFileSync(svgPath, 'utf8');
    raw = raw.replace(/<\?xml[\s\S]*?\?>\s*/i, '').replace(/<!DOCTYPE[\s\S]*?>\s*/i, '').trim();

    // Ensure the root <svg> has id="cat-svg" and class contains "cat-svg"
    raw = raw.replace(/<svg([^>]*?)>/i, (match, attrs) => {
        let attrsStr = attrs || '';
        if (/\sid=/.test(attrsStr)) {
            attrsStr = attrsStr.replace(/\s+id=(['"])(.*?)\1/, ' id="cat-svg"');
        } else {
            attrsStr += ' id="cat-svg"';
        }

        if (/\sclass=/.test(attrsStr)) {
            attrsStr = attrsStr.replace(/\s+class=(['"])(.*?)\1/, (m, q, cls) => ` class="${cls} cat-svg"`);
        } else {
            attrsStr += ' class="cat-svg"';
        }

        return `<svg${attrsStr}>`;
        
    });

    catSvgInline = raw;
} catch (e) {
    catSvgInline = `<svg id="cat-svg" class="cat-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"></svg>`;
}

function generateLayout({ title, content, currentPath = '/' }) {
    const depth = Math.max(0, currentPath.split('/').filter(Boolean).length - 1);
    const base = depth === 0 ? './' : '../'.repeat(depth);

    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${base}css/main.css">
    <link rel="stylesheet" href="${base}css/github-dark.css" id="highlight-theme">
</head>
<body>
    <header class="header">
        <div class="header-nav">
            <div class="header-brand">
                <img src="${base}images/avatar.png" height="32" width="32" alt="Logo" style="border-radius: 50%;">
                <a href="${base}index.html">Penguin's Blog</a>
            </div>
            <div class="header-mascot" aria-hidden="true">
                ${catSvgInline}
            </div>
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
                <svg id="moon-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" style="display: none;"><path d="M9.598 1.591a.75.75 0 0 1 .785-.175 7 7 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.5 5.5 0 1 0 7.678-7.678Z"></path></svg>
                <svg id="sun-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.061 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06Z"></path></svg>
                Theme
            </button>
        </div>
    </header>

    <div class="container">
        <aside class="sidebar">
            ${sidebar({ base })}
        </aside>

        <main class="main-content">
            ${content}
        </main>
    </div>

    <script>window.siteBaseUrl = "${base}";</script>
    <script src="${base}js/theme.js"></script>
    ${currentPath === '/' || currentPath === 'index.html' || currentPath.startsWith('page') ? `<script src="${base}js/graph.js"></script>` : ''}
</body>
</html>`;
}

export default generateLayout;
