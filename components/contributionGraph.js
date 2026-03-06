function generateContributionGraph() {
    // 52 columns by 7 rows
    let cols = '';
    for (let c = 0; c < 52; c++) {
        let colCells = '';
        for (let r = 0; r < 7; r++) {
            colCells += `<div class="cell" data-col="${c}" data-row="${r}"></div>\n`;
        }
        cols += `<div style="display:contents;">${colCells}</div>`;
    }

    return `
<div class="contribution-section">
    <h3>753 contributions in the last year</h3>
    <div class="graph-container">
        <div class="graph" id="contribution-graph">
            ${cols}
        </div>
    </div>
</div>
    `;
}

export default generateContributionGraph;
