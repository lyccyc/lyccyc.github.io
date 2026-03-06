const sidebar = require('./sidebar');

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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${base}css/main.css">
    <link rel="stylesheet" href="${base}css/github-dark.css" id="highlight-theme">
</head>
<body>
    <header class="header">
        <div class="header-nav">
            <div>
                <img src="${base}images/avatar.png" height="32" width="32" alt="Logo" style="border-radius: 50%;">
                <a href="${base}index.html">Penguin's Blog</a>
            </div>
            <div class="header-cat-area">
                <svg class="cat-svg" id="cat-svg" viewBox="0 0 120 100" width="48" height="40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cat illustration">
                    <!-- Left ear -->
                    <path class="cat-ear cat-ear-left" d="M25 45 L15 15 L40 30 Z" stroke-width="2.5" stroke-linejoin="round"/>
                    <!-- Right ear -->
                    <path class="cat-ear cat-ear-right" d="M95 45 L105 15 L80 30 Z" stroke-width="2.5" stroke-linejoin="round"/>
                    <!-- Inner left ear -->
                    <path class="cat-ear-inner" d="M27 40 L21 22 L37 32 Z" stroke-width="0" fill="none"/>
                    <!-- Inner right ear -->
                    <path class="cat-ear-inner" d="M93 40 L99 22 L83 32 Z" stroke-width="0" fill="none"/>
                    <!-- Head -->
                    <ellipse class="cat-head" cx="60" cy="55" rx="38" ry="32" stroke-width="2.5"/>
                    <!-- Left eye -->
                    <circle class="cat-eye cat-eye-left" cx="45" cy="50" r="4.5"/>
                    <!-- Right eye -->
                    <circle class="cat-eye cat-eye-right" cx="75" cy="50" r="4.5"/>
                    <!-- Left pupil -->
                    <circle class="cat-pupil" cx="46" cy="49" r="2"/>
                    <!-- Right pupil -->
                    <circle class="cat-pupil" cx="76" cy="49" r="2"/>
                    <!-- Nose -->
                    <path class="cat-nose" d="M57 60 L60 64 L63 60 Z" stroke-width="1.5" stroke-linejoin="round"/>
                    <!-- Mouth -->
                    <path class="cat-mouth" d="M60 64 Q57 69 52 67" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                    <path class="cat-mouth" d="M60 64 Q63 69 68 67" stroke-width="1.5" stroke-linecap="round" fill="none"/>
                    <!-- Left whiskers -->
                    <line class="cat-whisker cat-whisker-left" x1="38" y1="58" x2="12" y2="54" stroke-width="1.5" stroke-linecap="round"/>
                    <line class="cat-whisker cat-whisker-left" x1="38" y1="62" x2="12" y2="63" stroke-width="1.5" stroke-linecap="round"/>
                    <line class="cat-whisker cat-whisker-left" x1="38" y1="66" x2="14" y2="72" stroke-width="1.5" stroke-linecap="round"/>
                    <!-- Right whiskers -->
                    <line class="cat-whisker cat-whisker-right" x1="82" y1="58" x2="108" y2="54" stroke-width="1.5" stroke-linecap="round"/>
                    <line class="cat-whisker cat-whisker-right" x1="82" y1="62" x2="108" y2="63" stroke-width="1.5" stroke-linecap="round"/>
                    <line class="cat-whisker cat-whisker-right" x1="82" y1="66" x2="106" y2="72" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
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

module.exports = generateLayout;
