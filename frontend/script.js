// State management
let analysisData = null;
let chartInstances = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsDashboard = document.getElementById('resultsDashboard');
const errorMessage = document.getElementById('errorMessage');
const resetBtn = document.getElementById('resetBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');

// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    document.getElementById(pageId + 'Page').classList.add('active');
    event.target.classList.add('active');
    
    window.scrollTo(0, 0);
}

// Scroll helpers
function scrollToUpload() {
    document.getElementById('productPreview').scrollIntoView({ behavior: 'smooth' });
}

function scrollToPreview() {
    document.getElementById('productPreview').scrollIntoView({ behavior: 'smooth' });
}

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
        handleFileUpload(file);
    } else {
        showError('Please upload a valid CSV file.');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileUpload(file);
    }
});

uploadBtn.addEventListener('click', () => fileInput.click());

resetBtn.addEventListener('click', () => {
    resultsDashboard.classList.add('hidden');
    document.getElementById('uploadSection').classList.remove('hidden');
    fileInput.value = '';
    analysisData = null;
    window.scrollTo({ top: document.getElementById('productPreview').offsetTop - 100, behavior: 'smooth' });
});

exportPdfBtn.addEventListener('click', () => exportReport('pdf'));
exportJsonBtn.addEventListener('click', () => exportReport('json'));

// File Upload Handler
async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    // UI state
    document.getElementById('uploadSection').classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    resultsDashboard.classList.add('hidden');

    try {
        const response = await fetch(window.location.origin + '/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Analysis failed');
        }

        analysisData = await response.json();
        renderDashboard();
    } catch (err) {
        showError(err.message);
        document.getElementById('uploadSection').classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Dashboard Rendering
function renderDashboard() {
    resultsDashboard.classList.remove('hidden');
    
    // Summary
    document.getElementById('rowCount').textContent = analysisData.summary.rows.toLocaleString();
    document.getElementById('colCount').textContent = analysisData.summary.columns.toLocaleString();
    document.getElementById('missingCount').textContent = analysisData.summary.missing_values.toLocaleString();
    document.getElementById('missingPercent').textContent = analysisData.summary.missing_percentage.toFixed(1) + '%';

    // Statistics Table
    populateStatsTable();

    // Insights
    populateInsights();

    // Charts
    renderCharts();

    // Scroll to results
    resultsDashboard.scrollIntoView({ behavior: 'smooth' });
}

function populateStatsTable() {
    const tbody = document.getElementById('statsBody');
    tbody.innerHTML = '';

    // Convert statistics object to array format
    let statsArray = [];
    if (analysisData.statistics && typeof analysisData.statistics === 'object') {
        statsArray = Object.entries(analysisData.statistics).map(([column, stats]) => ({
            column: column,
            mean: stats.mean,
            median: stats.median,
            min: stats.min,
            max: stats.max,
            std: stats.std
        }));
    }

    if (statsArray.length > 0) {
        statsArray.forEach(stat => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600">${stat.column}</td>
                <td>${stat.mean !== null ? stat.mean.toFixed(2) : 'N/A'}</td>
                <td>${stat.median !== null ? stat.median.toFixed(2) : 'N/A'}</td>
                <td>${stat.min !== null ? stat.min.toFixed(2) : 'N/A'}</td>
                <td>${stat.max !== null ? stat.max.toFixed(2) : 'N/A'}</td>
                <td>${stat.std !== null ? stat.std.toFixed(2) : 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No numerical data available for statistics.</td></tr>';
    }
}

function populateInsights() {
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = '';

    analysisData.insights.forEach(insight => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        const textSpan = document.createElement('div');
        textSpan.className = 'insight-text';
        textSpan.textContent = insight;
        card.appendChild(textSpan);
        insightsList.appendChild(card);
    });
}

function renderCharts() {
    // Destroy existing instances
    chartInstances.forEach(instance => instance.destroy());
    chartInstances = [];

    const charts = analysisData.charts || {};
    console.log("Charts received:", charts);

    const chartsGrid = document.querySelector('.charts-grid');
    chartsGrid.innerHTML = ''; // Clear existing containers

    // Iterate through all charts returned by the API
    Object.entries(charts).forEach(([type, data]) => {
        if (!data || !data.labels || !data.values) return;

        // Create dedicated chart card
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.style.display = 'block'; // Ensure block display
        card.style.overflow = 'visible'; // Ensure visible overflow

        const chartId = `chart_${type}_${Math.random().toString(36).substr(2, 9)}`;
        
        let description = "";
        switch(type) {
            case 'bar': description = "Comparison of top categories by volume."; break;
            case 'pie': description = "Distribution breakdown of key categorical data."; break;
            case 'histogram': description = "Frequency distribution of numerical values."; break;
            case 'line': description = "Time-series analysis of key metrics."; break;
            default: description = "Visual representation of analyzed data.";
        }

        card.innerHTML = `
            <div class="chart-header">
                <h4 class="chart-title">${data.title}</h4>
                <p class="chart-desc">${description}</p>
            </div>
            <div class="chart-wrapper" style="position: relative; height: 320px; width: 100%; display: block;">
                <canvas id="${chartId}"></canvas>
            </div>
        `;

        chartsGrid.appendChild(card);

        // Initialize Chart.js
        const ctx = document.getElementById(chartId).getContext('2d');
        const chartType = type === 'histogram' ? 'bar' : (type === 'line' ? 'line' : (type === 'pie' ? 'pie' : 'bar'));
        
        const config = {
            type: chartType,
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.title,
                    data: data.values,
                    backgroundColor: type === 'pie' ? [
                        'rgba(46, 139, 87, 0.8)',
                        'rgba(60, 179, 113, 0.8)',
                        'rgba(32, 178, 170, 0.8)',
                        'rgba(143, 188, 143, 0.8)',
                        'rgba(0, 128, 128, 0.8)'
                    ] : (type === 'line' ? 'rgba(46, 139, 87, 0.1)' : 'rgba(46, 139, 87, 0.8)'),
                    borderColor: 'rgba(46, 139, 87, 1)',
                    borderWidth: type === 'line' ? 3 : 1,
                    fill: type === 'line',
                    tension: type === 'line' ? 0.4 : 0,
                    borderRadius: type === 'bar' || type === 'histogram' ? 4 : 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: type === 'pie',
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    },
                    title: { display: false }
                }
            }
        };

        // Add scales for non-pie charts
        if (type !== 'pie') {
            config.options.scales = {
                y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
                x: { grid: { display: false } }
            };
        }

        const newChart = new Chart(ctx, config);
        chartInstances.push(newChart);
    });
}

// Export Report
function exportReport(format) {
    if (!analysisData) return;

    if (format === 'json') {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(analysisData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "insights_report.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    } else if (format === 'pdf') {
        // Basic PDF generation using window.print() or alert for MVP
        // In a real scenario, we'd use a library like jsPDF
        window.print();
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}
