function generateSidebar({ base }) {
    return `
<div class="avatar-wrapper">
    <img src="${base}images/avatar.png" alt="Avatar" class="avatar" onerror="this.src='https://avatars.githubusercontent.com/u/9919?s=280&v=4'">
</div>
<div class="names">
    <h1>Penguin</h1>
</div>
<div class="bio">
    <p>CTF Player (Web, Pwn)</p>
</div>
<ul class="profile-details">
    <li>
        <svg viewBox="0 0 16 16" width="16" height="16"><path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Zm-1.06-8.132v-.001a5 5 0 1 0-7.072 7.072L8 14.07l3.536-3.534a5 5 0 0 0 0-7.072ZM8 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"></path></svg>
        Taiwan
    </li>
    <li>
        <svg viewBox="0 0 16 16" width="16" height="16"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path></svg>
        <a href="https://github.com/lyccyc">lyccyc</a>
    </li>
    <li>
        <svg viewBox="0 0 16 16" width="16" height="16"><path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2ZM1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809v6.442Zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z"></path></svg>
        <a href="mailto:yuzhen@duck.com">yuzhen@duck.com</a>
    </li>
</ul>
<div class="divider"></div>
<h3>Tags / Skills</h3>
<div class="repo-tags" style="margin-top: 8px;">
    <a href="${base}tags/CTF/index.html" class="tag">CTF</a>
    <a href="${base}tags/pwn/index.html" class="tag">pwn</a>
    <a href="${base}tags/web/index.html" class="tag">web</a>
    <a href="${base}tags/AI/index.html" class="tag">AI</a>
    <a href="${base}tags/AIS3/index.html" class="tag">AIS3</a>
    <a href="${base}tags/HITCON/index.html" class="tag">HITCON</a>
</div>
    `;
}

module.exports = generateSidebar;
