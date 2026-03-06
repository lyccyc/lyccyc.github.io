const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const hljs = require('highlight.js');
const generateLayout = require('../components/layout');
const generateContributionGraph = require('../components/contributionGraph');

// Configure Marked to use Highlight.js
marked.setOptions({
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

// Directories
const CONTENT_DIR = path.join(__dirname, '../content/posts');
const PUBLIC_DIR = path.join(__dirname, '../public');
const POSTS_PER_PAGE = 6;

// Create folders if they don't exist
function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Ensure public dirs
ensureDirSync(PUBLIC_DIR);
ensureDirSync(path.join(PUBLIC_DIR, 'css'));
ensureDirSync(path.join(PUBLIC_DIR, 'js'));
ensureDirSync(path.join(PUBLIC_DIR, 'images'));
ensureDirSync(path.join(PUBLIC_DIR, 'posts'));
ensureDirSync(path.join(PUBLIC_DIR, 'tags'));
ensureDirSync(path.join(PUBLIC_DIR, 'page'));

// Copy static assets
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) return;
    ensureDirSync(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyDirSync(path.join(__dirname, '../styles'), path.join(PUBLIC_DIR, 'css'));
copyDirSync(path.join(__dirname, '../scripts'), path.join(PUBLIC_DIR, 'js'));
copyDirSync(path.join(__dirname, '../images'), path.join(PUBLIC_DIR, 'images'));

// Read all markdown posts
const posts = [];
if (fs.existsSync(CONTENT_DIR)) {
    const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));

    files.forEach(file => {
        const rawContent = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        const { data, content } = matter(rawContent);

        // Replace any markdown image paths like /images/post-images/ to use proper paths (we'll fix HTML later too)
        let htmlContent = marked.parse(content);
        // Ensure image references use the absolute-like local logic or correct relative base
        // Post pages are at depths of 2: /posts/{slug}/index.html so base to root is ../../
        htmlContent = htmlContent.replace(/src="[^"]*?images\/post-images\//g, 'src="../../images/post-images/');

        posts.push({
            slug: file.replace('.md', ''),
            title: data.title || 'Untitled',
            date: data.date ? new Date(data.date) : new Date(),
            summary: data.summary || '',
            tags: data.tags ? (Array.isArray(data.tags) ? data.tags : data.tags.split(',')) : [],
            content: htmlContent
        });
    });
}

// Sort posts by date descending
posts.sort((a, b) => b.date - a.date);

function formatDate(dateObj) {
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function generatePostCard(post, base = './') {
    const tagsHtml = post.tags.map(tag => `<a href="${base}tags/${tag}/index.html" class="tag">${tag}</a>`).join('');
    return `
    <div class="repo-card">
        <h3><a href="${base}posts/${post.slug}/index.html">${post.title}</a></h3>
        <p>${post.summary}</p>
        <div class="repo-meta">
            <span>Posted on ${formatDate(post.date)}</span>
            <div class="repo-tags">${tagsHtml}</div>
        </div>
    </div>
    `;
}

// Generate Home and paginated index pages
const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE) || 1;

for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const pagePosts = posts.slice(start, end);
    const isFirstPage = page === 1;

    // Pagination HTML
    let paginationHtml = '<div class="pagination">';
    if (page > 1) {
        const prevLink = page === 2 ? '../index.html' : `${page - 1}.html`;
        paginationHtml += `<a href="${prevLink}">Previous</a>`;
    }
    for (let p = 1; p <= totalPages; p++) {
        const pLink = p === 1 ? '../index.html' : `${p}.html`;
        if (p === page) {
            paginationHtml += `<span class="current">${p}</span>`;
        } else {
            paginationHtml += `<a href="${pLink}">${p}</a>`;
        }
    }
    if (page < totalPages) {
        paginationHtml += `<a href="${page + 1}.html">Next</a>`;
    }
    paginationHtml += '</div>';

    let mainContent = '';

    if (isFirstPage) {
        mainContent += `
        <div class="readme-box">
            <h2>Penguin / README.md</h2>
            <div class="markdown-body">
                <h2>About me :</h2>
                <p>國立東華大學資訊工程學系大三，資安新手 Forever(web 狗，目前朝向 pwn 監獄前進)</p>
                <p>主要記錄一些打 CTF 的 writeups，大多文章都會和資安相關</p>
                <hr>
                <h2>Current project :</h2>
                <ol>
                    <li>以格式保留演算法 FF1 及 FF3 完成外來人口統一證號的身分證字號加密實作<br>(Encrypting Identification Card Number with Foreign Residents by Format-preserving Encryption FF1 and FF3 Algorithms)</li>
                    <li>以強化學習 (RL) 提升入侵與攻擊模擬 (BAS) 的研究</li>
                </ol>
            </div>
        </div>
        ${generateContributionGraph()}
        `;
    }

    mainContent += `
    <h3 style="margin-bottom:16px;">Latest Posts</h3>
    <div class="repo-list">
        ${pagePosts.map(p => generatePostCard(p, isFirstPage ? './' : '../')).join('')}
    </div>
    `;

    if (totalPages > 1) {
        mainContent += paginationHtml;
    }

    // Also adjust pagination links on index page directly to use page/N.html
    const indexPaginationHtml = paginationHtml.replace(/href="\.\.\/index\.html"/g, 'href="index.html"').replace(/href="(\d+)\.html"/g, 'href="page/$1.html"');

    const html = generateLayout({
        title: isFirstPage ? "Penguin's Blog - Home" : `Penguin's Blog - Page ${page}`,
        content: isFirstPage ? mainContent.replace(paginationHtml, indexPaginationHtml) : mainContent,
        currentPath: isFirstPage ? 'index.html' : `page/${page}.html`
    });

    const outPath = path.join(PUBLIC_DIR, isFirstPage ? 'index.html' : `page/${page}.html`);
    fs.writeFileSync(outPath, html);

    if (isFirstPage) {
        // Also create page/1.html so /page/1.html isn't a 404 (optional but good for consistency requested)
        const htmlPage1 = generateLayout({
            title: `Penguin's Blog - Page 1`,
            content: mainContent,
            currentPath: `page/1.html`
        });
        fs.writeFileSync(path.join(PUBLIC_DIR, `page/1.html`), htmlPage1);
    }
}

// Generate /posts index (All posts)
ensureDirSync(path.join(PUBLIC_DIR, 'posts'));
const allPostsContent = `
    <h3 style="margin-bottom:16px;">All Posts</h3>
    <div class="repo-list">
        ${posts.map(p => generatePostCard(p, '../')).join('')}
    </div>
`;
const allPostsHtml = generateLayout({
    title: "All Posts - Penguin's Blog",
    content: allPostsContent,
    currentPath: 'posts/index.html'
});
fs.writeFileSync(path.join(PUBLIC_DIR, 'posts', 'index.html'), allPostsHtml);

// Generate Individual Post Pages
posts.forEach((post, index) => {
    const postDir = path.join(PUBLIC_DIR, 'posts', post.slug);
    ensureDirSync(postDir);

    const tagsHtml = post.tags.map(tag => `<a href="../../tags/${tag}/index.html" class="tag">${tag}</a>`).join('');

    let prevHtml = '';
    let nextHtml = '';

    if (index > 0) {
        const nextPost = posts[index - 1]; // Newer post
        nextHtml = `<a href="../../posts/${nextPost.slug}/index.html" style="margin-left:auto;">Next: ${nextPost.title} &rarr;</a>`;
    }
    if (index < posts.length - 1) {
        const prevPost = posts[index + 1]; // Older post
        prevHtml = `<a href="../../posts/${prevPost.slug}/index.html">&larr; Prev: ${prevPost.title}</a>`;
    }

    const navigationHtml = (prevHtml || nextHtml) ? `
    <div style="margin-top: 32px; border-top: 1px solid var(--border-color); padding-top: 16px; display: flex; justify-content: space-between;">
        ${prevHtml}
        ${nextHtml}
    </div>` : '';

    const content = `
    <div class="post-header">
        <h1>${post.title}</h1>
        <div class="meta">
            <span>📅 ${formatDate(post.date)}</span>
            <div class="repo-tags">${tagsHtml}</div>
        </div>
    </div>
    <div class="markdown-body">
        ${post.content}
    </div>
    ${navigationHtml}
    `;

    const html = generateLayout({
        title: `${post.title} - Penguin's Blog`,
        content: content,
        currentPath: `posts/${post.slug}/index.html`
    });

    fs.writeFileSync(path.join(postDir, 'index.html'), html);
});

// Generate Tag pages (with /tags root page)
const tagsMap = {};
posts.forEach(post => {
    post.tags.forEach(tag => {
        if (!tagsMap[tag]) tagsMap[tag] = [];
        tagsMap[tag].push(post);
    });
});

ensureDirSync(path.join(PUBLIC_DIR, 'tags'));
const allTagsHtmlContent = `
    <h3 style="margin-bottom:16px;">All Tags</h3>
    <div class="tag-cloud" style="display:flex; flex-wrap:wrap; gap:8px;">
        ${Object.keys(tagsMap).map(tag => `<a href="${tag}/index.html" class="tag" style="margin:0;">${tag} (${tagsMap[tag].length})</a>`).join('')}
    </div>
`;
const tagsIndexHtml = generateLayout({
    title: "All Tags - Penguin's Blog",
    content: allTagsHtmlContent,
    currentPath: 'tags/index.html'
});
fs.writeFileSync(path.join(PUBLIC_DIR, 'tags', 'index.html'), tagsIndexHtml);

Object.keys(tagsMap).forEach(tag => {
    const tagPosts = tagsMap[tag];
    const tagDir = path.join(PUBLIC_DIR, 'tags', tag);
    ensureDirSync(tagDir);

    const content = `
    <h3 style="margin-bottom:16px;">Posts tagged with <span class="tag">${tag}</span></h3>
    <div class="repo-list">
        ${tagPosts.map(p => generatePostCard(p, '../../')).join('')}
    </div>
    `;

    const html = generateLayout({
        title: `Tag: ${tag} - Penguin's Blog`,
        content: content,
        currentPath: `tags/${tag}/index.html`
    });

    fs.writeFileSync(path.join(tagDir, 'index.html'), html);
});

console.log('Build complete! Generated ' + posts.length + ' posts.');
