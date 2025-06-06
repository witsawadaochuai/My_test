// <--------------------------->
// APPLICATION STATE
// <--------------------------->
let charts = {};
let processedData = {
    hourlyCounts: {},
    keywordByHour: {},
    engagementByHour: {},
    monthlyEngagements: {},
    totalMessages: 0,
    totalViews: 0,
    totalLikes: 0
};

const hours = [...Array(24).keys()].map(h => `${h.toString().padStart(2, '0')}:00`);
const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// <--------------------------->
// INITIALIZATION
// <--------------------------->
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupLoginForm();
    setupPasswordToggle();
    setupLogout();
    setupAuthSwitching();
    setupSignupForm();
}

// <--------------------------->
// LOGIN FUNCTIONALITY
// <--------------------------->
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
}

function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showAlert('Please enter both email and password');
        return;
    }

    fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error('Login failed');
        return res.json();
    })
    .then(data => {
        localStorage.setItem('token', data.token);
        switchToDashboard();
    })
    .catch(err => {
        showAlert('Login failed: ' + err.message);
    });
}


function switchToDashboard() {
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');

    if (loginPage) loginPage.style.display = 'none';
    if (dashboardPage) dashboardPage.style.display = 'block';
    document.body.style.background = '#f7fafc';

    // โหลดข้อมูลจากไฟล์ JSON จาก backend
    fetch('http://localhost:3000/api/charts',{
        headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
    })
        .then(response => response.json())
        .then(data => {
            processDashboardData(data);
            initializeCharts();
            startDataUpdates();
        })
        .catch(error => {
            console.error('Error loading example_data.json:', error);
            showAlert('ไม่สามารถโหลดข้อมูลจาก example_data.json ได้');
        });
}


function setupPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁' : '🙈';
        });
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('token');
            switchToLogin();
        });
    }
}


function switchToLogin() {
    const loginPage = document.getElementById('loginPage');
    const dashboardPage = document.getElementById('dashboardPage');

    if (dashboardPage) dashboardPage.style.display = 'none';
    if (loginPage) loginPage.style.display = 'block';
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();

    // Destroy charts
    Object.values(charts).forEach(chart => {
        if (chart && chart.destroy) chart.destroy();
    });
    charts = {};
}

function setupAuthSwitching() {
    const signupLink = document.querySelector('.sign-up');
    const backToLogin = document.querySelector('.back-to-login');

    if (signupLink) {
        signupLink.addEventListener('click', function (e) {
            e.preventDefault();
            const loginPage = document.getElementById('loginPage');
            const signupPage = document.getElementById('signupPage');
            if (loginPage) loginPage.classList.add('hidden');
            if (signupPage) signupPage.classList.remove('hidden');
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', function (e) {
            e.preventDefault();
            const loginPage = document.getElementById('loginPage');
            const signupPage = document.getElementById('signupPage');
            if (signupPage) signupPage.classList.add('hidden');
            if (loginPage) loginPage.classList.remove('hidden');
        });
    }
}

function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleSignup();
        });
    }
}

function handleSignup() {
    const email = document.getElementById('signupEmail')?.value;
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;

    if (!email || !password || !confirmPassword) {
        showAlert('Please fill in all fields.');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('Passwords do not match.');
        return;
    }

    fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error('Signup failed');
        return res.json();
    })
    .then(data => {
        showAlert('Sign up successful! Please log in.');
        document.getElementById('signupForm')?.reset();
        document.getElementById('signupPage')?.classList.add('hidden');
        document.getElementById('loginPage')?.classList.remove('hidden');
    })
    .catch(err => {
        showAlert('Sign up failed: ' + err.message);
    });
}


// ===========================
// DATA PROCESSING
// ===========================
function processDashboardData(data) {
    // Reset processed data
    processedData = {
        hourlyCounts: {},
        keywordByHour: {},
        engagementByHour: {},
        monthlyEngagements: {},
        totalMessages: 0,
        totalViews: 0,
        totalLikes: 0
    };

    data.forEach(item => {
        const date = new Date(item.publisheddate);
        const month = date.toLocaleString('default', { month: 'short' });
        const hour = `${date.getHours().toString().padStart(2, '0')}:00`;

        // Monthly engagement
        if (!processedData.monthlyEngagements[month]) {
            processedData.monthlyEngagements[month] = { views: 0, comments: 0, likes: 0 };
        }
        processedData.monthlyEngagements[month].views += item.engagement_view || 0;
        processedData.monthlyEngagements[month].comments += item.engagement_comment || 0;
        processedData.monthlyEngagements[month].likes += item.engagement_like || 0;

        // Hourly message count
        if (!processedData.hourlyCounts[hour]) processedData.hourlyCounts[hour] = 0;
        processedData.hourlyCounts[hour]++;

        // Keyword by hour
        const keywords = item.keyword.split(',').map(k => k.trim());
        if (!processedData.keywordByHour[hour]) processedData.keywordByHour[hour] = {};
        keywords.forEach(k => {
            if (!processedData.keywordByHour[hour][k]) processedData.keywordByHour[hour][k] = 0;
            processedData.keywordByHour[hour][k]++;
        });

        // Engagement by hour
        if (!processedData.engagementByHour[hour]) {
            processedData.engagementByHour[hour] = {
                view: 0, comment: 0, share: 0, like: 0, love: 0, wow: 0, sad: 0, angry: 0
            };
        }
        const e = processedData.engagementByHour[hour];
        e.view += item.engagement_view || 0;
        e.comment += item.engagement_comment || 0;
        e.share += item.engagement_share || 0;
        e.like += item.engagement_like || 0;
        e.love += item.engagement_love || 0;
        e.wow += item.engagement_wow || 0;
        e.sad += item.engagement_sad || 0;
        e.angry += item.engagement_angry || 0;
    });

    processedData.totalMessages = data.length;
    processedData.totalViews = data.reduce((sum, d) => sum + (d.engagement_view || 0), 0);
    processedData.totalLikes = data.reduce((sum, d) => sum + (d.engagement_like || 0), 0);

}


// ===========================
// CHART CREATION
// ===========================
function initializeCharts() {
    createTimelineDataChart();
    createTimelineEngagementChart();
    createKeywordChart();
}

function createTimelineDataChart() {
    const ctx = document.getElementById('timelineDataChart');
    if (!ctx) return;

    const hourLabels = hours;
    const messageCounts = hourLabels.map(h => processedData.hourlyCounts[h] || 0);

    charts.timelineData = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [{
                label: 'Messages by Hour',
                data: messageCounts,
                backgroundColor: 'rgba(66, 153, 225, 0.6)',
                borderColor: '#4299e1',
                borderWidth: 1
            }]
        },
        options: getChartOptions('Messages by Hour')
    });
}

function createTimelineEngagementChart() {
    const ctx = document.getElementById('timelineEngagementChart');
    if (!ctx) return;

    const labels = monthOrder.filter(m => processedData.monthlyEngagements[m]);
    const views = labels.map(m => processedData.monthlyEngagements[m]?.views || 0);
    const likes = labels.map(m => processedData.monthlyEngagements[m]?.likes || 0);
    const comments = labels.map(m => processedData.monthlyEngagements[m]?.comments || 0);

    charts.timelineEngagement = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { 
                    label: 'Views', 
                    data: views, 
                    borderColor: '#4299e1', 
                    backgroundColor: 'rgba(66, 153, 225, 0.1)', 
                    fill: true 
                },
                { 
                    label: 'Likes', 
                    data: likes, 
                    borderColor: '#48bb78', 
                    backgroundColor: 'rgba(72, 187, 120, 0.1)', 
                    fill: true 
                },
                { 
                    label: 'Comments', 
                    data: comments, 
                    borderColor: '#ed8936', 
                    backgroundColor: 'rgba(237, 137, 54, 0.1)', 
                    fill: true 
                }
            ]
        },
        options: getChartOptions('Engagement Timeline')
    });
}

function createKeywordChart() {
    const ctx = document.getElementById('timelineKeywordChart');
    if (!ctx) return;

    // Get all unique keywords
    const keywordCounts = {};
    Object.values(processedData.keywordByHour).forEach(hourData => {
        Object.entries(hourData).forEach(([keyword, count]) => {
            if (!keywordCounts[keyword]) keywordCounts[keyword] = 0;
            keywordCounts[keyword] += count;
        });
    });

    const sortedKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Top 10 keywords

    const labels = sortedKeywords.map(([keyword]) => keyword.substring(0, 20) + '...');
    const data = sortedKeywords.map(([,count]) => count);

    charts.keyword = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                label: 'Keyword Distribution',
                data,
                backgroundColor: [
                    '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#38b2ac',
                    '#f56565', '#ec407a', '#26a69a', '#ffa726', '#66bb6a'
                ]
            }]
                },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 12,
                            family: 'Segoe UI, sans-serif'
                        },
                        usePointStyle: true,
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value} keyword(s)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Top 10 Keywords by Frequency'
                }
            }
        }
    });
}

// ===========================
// DATA UPDATES
// ===========================
function startDataUpdates() {
    setInterval(updateStats, 5000);
}

function updateStats() {
    const stats = [
        { id: 'avgResponseTime', value: (Math.random() * 3 + 1).toFixed(1) + 's' },
        { id: 'successRate', value: (Math.random() * 2 + 97).toFixed(1) + '%' }
    ];

    stats.forEach(stat => {
        const el = document.getElementById(stat.id);
        if (el) {
            el.style.transform = 'scale(1.1)';
            el.textContent = stat.value;
            setTimeout(() => el.style.transform = 'scale(1)', 200);
        }
    });
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function getChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: !!title,
                text: title
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                cornerRadius: 8
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#718096'
                },
                grid: {
                    color: '#e2e8f0'
                }
            },
            x: {
                ticks: {
                    color: '#718096'
                },
                grid: {
                    color: '#e2e8f0'
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        elements: {
            line: {
                borderWidth: 2
            },
            point: {
                hoverRadius: 6
            }
        }
    };
}

function showAlert(message) {
    alert(message); // In production, use toast
}

window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => chart?.resize());
});
