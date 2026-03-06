document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('moon-icon');
    const sunIcon = document.getElementById('sun-icon');
    const highlightThemeLink = document.getElementById('highlight-theme');

    // Check saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateIcons(savedTheme);
    updateHighlightTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        updateIcons(newTheme);
        updateHighlightTheme(newTheme);

        // Trigger cat bounce animation
        const catSvg = document.getElementById('cat-svg');
        if (catSvg) {
            catSvg.classList.remove('cat-bounce');
            void catSvg.offsetWidth; // reflow to restart animation
            catSvg.classList.add('cat-bounce');
            catSvg.addEventListener('animationend', () => {
                catSvg.classList.remove('cat-bounce');
            }, { once: true });
        }
    });

    function updateIcons(theme) {
        if (theme === 'dark') {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }

    function updateHighlightTheme(theme) {
        if (!highlightThemeLink) return;
        const base = window.siteBaseUrl || './';
        if (theme === 'dark') {
            highlightThemeLink.href = base + 'styles/github-dark.css';
        } else {
            highlightThemeLink.href = base + 'styles/github-light.css';
        }
    }

    // Cat eye tracking (subtle mouse follow)
    const catSvg = document.getElementById('cat-svg');
    const pupils = document.querySelectorAll('.cat-pupil');

    if (catSvg && pupils.length > 0) {
        document.addEventListener('mousemove', (e) => {
            const rect = catSvg.getBoundingClientRect();
            // Calculate center of the cat SVG
            const catCenterX = rect.left + rect.width / 2;
            const catCenterY = rect.top + rect.height / 2;

            // Delta from cursor to cat center
            const deltaX = e.clientX - catCenterX;
            const deltaY = e.clientY - catCenterY;

            // Limit the maximum pixel movement so eyes stay inside the cat
            const maxMove = 3;

            // Scale movement softly based on screen distance
            const percentX = deltaX / (window.innerWidth / 2);
            const percentY = deltaY / (window.innerHeight / 2);

            const moveX = Math.max(-maxMove, Math.min(maxMove, percentX * maxMove * 1.5));
            const moveY = Math.max(-maxMove, Math.min(maxMove, percentY * maxMove * 1.5));

            // Apply lightweight SVG transform
            pupils.forEach(pupil => {
                pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });
    }
});
