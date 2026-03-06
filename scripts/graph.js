document.addEventListener('DOMContentLoaded', () => {
    const graph = document.getElementById('contribution-graph');
    if (!graph) return;

    // 0: empty, 1-4: color levels
    const PENGUIN_PATTERN = [
        "0000000000000000000000000000000",
        "1110111010010011101001011101001",
        "1010100011010100001001001001101",
        "1110111010110101101001001001011",
        "1000100010010100101001001001001",
        "1000111010010011100110011101001",
        "0000000000000000000000000000000"
    ];

    const COLS = 52;
    const ROWS = 7;
    const startCol = Math.floor((COLS - PENGUIN_PATTERN[0].length) / 2); // Center horizontally
    const startRow = 0;

    const cells = Array.from(document.querySelectorAll('.cell'));

    function animatePenguin() {
        // Reset all cells occasionally
        cells.forEach(cell => {
            cell.removeAttribute('data-level');
        });

        // Delay starting the text animation
        setTimeout(() => {
            cells.forEach(cell => {
                const c = parseInt(cell.getAttribute('data-col'));
                const r = parseInt(cell.getAttribute('data-row'));

                if (c >= startCol && c < startCol + PENGUIN_PATTERN[0].length) {
                    const relativeCol = c - startCol;
                    const relativeRow = r - startRow;

                    if (relativeRow >= 0 && relativeRow < PENGUIN_PATTERN.length) {
                        const char = PENGUIN_PATTERN[relativeRow][relativeCol];
                        if (char === '1') {
                            // Give it a random green level
                            const level = Math.floor(Math.random() * 4) + 1;

                            // add a cascade effect
                            setTimeout(() => {
                                cell.setAttribute('data-level', level);
                            }, (relativeCol * 50) + (Math.random() * 200));
                        } else {
                            // random noise occasionally on empty parts
                            if (Math.random() > 0.95) {
                                setTimeout(() => {
                                    cell.setAttribute('data-level', 1);
                                }, Math.random() * 2000);
                            }
                        }
                    }
                } else {
                    // Random background noise for github graph
                    if (Math.random() > 0.85) {
                        const level = Math.floor(Math.random() * 2) + 1;
                        setTimeout(() => {
                            cell.setAttribute('data-level', level);
                        }, Math.random() * 2000);
                    }
                }
            });
        }, 500);
    }

    // Initial animation
    animatePenguin();

    // Repeat every 10 seconds
    setInterval(animatePenguin, 10000);
});
