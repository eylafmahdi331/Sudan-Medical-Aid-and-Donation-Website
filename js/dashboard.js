// DOM Elements
const userName = document.getElementById('user-name');
const statsDonated = document.getElementById('stats-donated');
const statsDonationsCount = document.getElementById('stats-donations-count');
const statsCasesCount = document.getElementById('stats-cases-count');
const logoutBtn = document.getElementById('logout-btn');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const viewAllBtns = document.querySelectorAll('.view-all-btn');

const overviewDonations = document.getElementById('overview-donations');
const overviewCases = document.getElementById('overview-cases');
const allDonations = document.getElementById('all-donations');
const allCases = document.getElementById('all-cases');

document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    setupTabs();

    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = 'logout.php';
        }
    });
});

async function fetchDashboardData() {
    try {
        const response = await fetch('../api/dashboard.php');

        if (response.status === 401 || response.status === 403) {
            window.location.href = 'auth.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        renderDashboard(data);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
    }
}

function renderDashboard(data) {
    // User Info
    userName.textContent = data.user_name.split(' ')[0];

    // Stats
    const totalDonated = parseFloat(data.stats.total_donated || 0);
    statsDonated.textContent = `$${totalDonated.toLocaleString()}`;
    statsDonationsCount.textContent = data.stats.donation_count || 0;
    statsCasesCount.textContent = data.stats.cases_submitted || 0;

    const donations = data.donations || [];
    const cases = data.cases || [];

    // Render Lists
    renderOverview(donations, cases);
    renderAllDonations(donations);
    renderAllCases(cases);
}

function setupTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    viewAllBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });
}

function switchTab(target) {
    tabBtns.forEach(btn => {
        btn.dataset.tab === target
            ? btn.classList.add('bg-background', 'text-foreground', 'shadow-sm')
            : btn.classList.remove('bg-background', 'text-foreground', 'shadow-sm');
    });

    tabContents.forEach(content => {
        content.id === `tab-${target}`
            ? content.classList.remove('hidden')
            : content.classList.add('hidden');
    });
}

function getStatusBadge(status) {
    let classes = "";
    let label = status.charAt(0).toUpperCase() + status.slice(1);

    switch (status) {
        case "active": classes = "bg-primary/10 text-primary border-primary/20"; break;
        case "approved": classes = "bg-green-100 text-green-700 border-green-200"; break;
        case "funded": classes = "bg-success/10 text-success border-success/20"; label = "Fully Funded"; break;
        case "pending": classes = "bg-accent/10 text-accent-foreground border-accent/20"; label = "Pending Review"; break;
        case "completed": classes = "bg-success/10 text-success border-success/20"; break;
        case "rejected": classes = "bg-destructive/10 text-destructive border-destructive/20"; break;
        default: classes = "bg-secondary text-secondary-foreground";
    }

    return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}">${label}</span>`;
}

function renderOverview(donations, cases) {
    // Recent Donations (Top 3)
    overviewDonations.innerHTML = donations.length === 0
        ? '<p class="text-sm text-muted-foreground text-center py-4">No donations yet.</p>'
        : donations.slice(0, 3).map(donation => {
            const title = donation.CASE_TITLE ?? donation.CAMP_TITLE ?? 'General Donation';
            return `
            <div class="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <i data-lucide="heart" class="w-5 h-5 text-success"></i>
                    </div>
                    <div>
                        <p class="font-medium text-sm line-clamp-1">${title}</p>
                        <p class="text-xs text-muted-foreground">${new Date(donation.DONATION_DATE).toLocaleDateString()}</p>
                    </div>
                </div>
                <span class="font-bold text-success">$${parseFloat(donation.DONATION_AMOUNT).toLocaleString()}</span>
            </div>
        `; 
        }).join('');

    // Recent Cases (Top 2)
    overviewCases.innerHTML = cases.length === 0
        ? '<p class="text-sm text-muted-foreground text-center py-4">No cases submitted yet.</p>'
        : cases.slice(0, 2).map(caseItem => `
            <div class="p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <p class="font-medium text-sm line-clamp-1">${caseItem.CASE_TITLE}</p>
                        <p class="text-xs text-muted-foreground">Status: ${caseItem.CASE_STATUS}</p>
                    </div>
                    ${getStatusBadge(caseItem.CASE_STATUS)}
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between text-xs">
                        <span class="text-muted-foreground">Progress</span>
                        <span class="font-medium">$${parseFloat(caseItem.CASE_COLL_AMOUNT).toLocaleString()} / $${parseFloat(caseItem.CASE_REQ_AMOUNT).toLocaleString()}</span>
                    </div>
                    <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div class="h-full bg-primary transition-all duration-300" style="width: ${(caseItem.CASE_COLL_AMOUNT / caseItem.CASE_REQ_AMOUNT) * 100}%"></div>
                    </div>
                </div>
            </div>
        `).join('');

    lucide.createIcons();
}

function renderAllDonations(donations) {
    allDonations.innerHTML = donations.length === 0
        ? '<p class="text-muted-foreground text-center py-8">You haven\'t made any donations yet.</p>'
        : donations.map(donation => {
            const title = donation.CASE_TITLE ?? donation.CAMP_TITLE ?? 'General Donation';
            return `
        <div class="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/20 transition-colors">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                    <i data-lucide="heart" class="w-6 h-6 text-success"></i>
                </div>
                <div>
                    <p class="font-medium">${title}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <i data-lucide="calendar" class="w-3 h-3 text-muted-foreground"></i>
                        <span class="text-xs text-muted-foreground">${new Date(donation.DONATION_DATE).toLocaleDateString()}</span>
                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-success/10 text-success border-success/20">Completed</span>
                    </div>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xl font-bold text-success">$${parseFloat(donation.DONATION_AMOUNT).toLocaleString()}</p>
            </div>
        </div>
        `; 
        }).join('');

    lucide.createIcons();
}

function renderAllCases(cases) {
    allCases.innerHTML = (!cases || cases.length === 0)
        ? `
        <div class="text-center py-8">
            <p class="text-muted-foreground mb-4">You haven't submitted any cases yet.</p>
            <a href="./submit-case.html" class="text-primary hover:underline font-medium">Submit your first case</a>
        </div>`
        : cases.map(caseItem => `
        <div class="p-6 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-card transition-all">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-serif text-lg font-semibold">${caseItem.CASE_TITLE}</h3>
                        ${getStatusBadge(caseItem.CASE_STATUS)}
                    </div>
                    <div class="flex items-center gap-4 text-sm text-muted-foreground">
                        <span class="flex items-center gap-1">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            Submitted ${new Date(caseItem.CASE_CREATED_AT).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div class="space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Funding Progress</span>
                    <span class="font-semibold">${Math.round((caseItem.CASE_COLL_AMOUNT / caseItem.CASE_REQ_AMOUNT) * 100)}%</span>
                </div>
                <div class="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div class="h-full bg-primary transition-all duration-300" style="width: ${(caseItem.CASE_COLL_AMOUNT / caseItem.CASE_REQ_AMOUNT) * 100}%"></div>
                </div>
                <div class="flex justify-between text-sm">
                    <span>
                        <span class="font-bold text-foreground">$${parseFloat(caseItem.CASE_COLL_AMOUNT).toLocaleString()}</span>
                        <span class="text-muted-foreground"> raised</span>
                    </span>
                    <span class="text-muted-foreground">Goal: $${parseFloat(caseItem.CASE_REQ_AMOUNT).toLocaleString()}</span>
                </div>
            </div>
        </div>
        `).join('');

    lucide.createIcons();
}

