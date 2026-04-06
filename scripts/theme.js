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

    const catSvg = document.getElementById('cat-svg');
    const catEyes = [
        document.getElementById('cat-eye-left'),
        document.getElementById('cat-eye-right'),
    ].filter(Boolean);

    if (catSvg && catEyes.length > 0) {
        const eyeMotion = {
            maxOffset: 3,
            smoothing: 0.16,
        };
        const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const currentOffset = { x: 0, y: 0 };
        let frameId = null;

        const renderEyes = () => {
            currentOffset.x += (pointer.x - currentOffset.x) * eyeMotion.smoothing;
            currentOffset.y += (pointer.y - currentOffset.y) * eyeMotion.smoothing;

            catEyes.forEach((eye) => {
                const eyeX = Number(eye.dataset.eyeX);
                const eyeY = Number(eye.dataset.eyeY);
                const rect = catSvg.getBoundingClientRect();
                const scaleX = rect.width / 512;
                const scaleY = rect.height / 512;
                const screenX = rect.left + eyeX * scaleX;
                const screenY = rect.top + eyeY * scaleY;
                const deltaX = currentOffset.x - screenX;
                const deltaY = currentOffset.y - screenY;
                const distance = Math.hypot(deltaX, deltaY) || 1;
                const limitedDistance = Math.min(eyeMotion.maxOffset, distance / 18);
                const moveX = (deltaX / distance) * limitedDistance;
                const moveY = (deltaY / distance) * limitedDistance;
                eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });

            frameId = window.requestAnimationFrame(renderEyes);
        };

        document.addEventListener('mousemove', (event) => {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
        });

        document.addEventListener('mouseleave', () => {
            pointer.x = window.innerWidth / 2;
            pointer.y = window.innerHeight / 2;
        });

        window.addEventListener('blur', () => {
            pointer.x = window.innerWidth / 2;
            pointer.y = window.innerHeight / 2;
        });

        if (frameId === null) {
            frameId = window.requestAnimationFrame(renderEyes);
        }
    }
});
