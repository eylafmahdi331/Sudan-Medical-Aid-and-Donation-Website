// State
let allCampaigns = [];
let state = { sort: 'newest', urgent: false, type: 'all' };

document.addEventListener('DOMContentLoaded', () => {
    fetchCampaigns();
    setupEventListeners();
});

// Fetch cases from API
async function fetchCampaigns() {
    try {
        const res = await fetch('../api/get_cases.php');
        const data = await res.json();
        if (data.cases) {
            allCampaigns = data.cases;
            calculateStats(allCampaigns);
            render();
        }
    } catch (e) {
        console.error('Error fetching cases:', e);
        const grid = document.getElementById('cases-grid');
        if (grid) grid.innerHTML = `<p class="col-span-full text-center py-20">Unable to load cases.</p>`;
    }
}

// Event listeners for search, sort, clear
function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => render());
    }

    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            state.sort = (state.sort === 'newest') ? 'oldest' : 'newest';
            const sortLabel = document.getElementById('sort-label');
            if (sortLabel) {
                sortLabel.textContent = (state.sort === 'newest') ? 'Newest First' : 'Oldest First';
            }
            render();
        });
    }

    const urgentBtn = document.getElementById('filter-urgent');
    if (urgentBtn) {
        urgentBtn.addEventListener('click', () => {
            state.urgent = !state.urgent;
            if (state.urgent) {
                urgentBtn.classList.add('bg-primary', 'text-primary-foreground');
                urgentBtn.classList.remove('border-primary', 'text-primary', 'bg-background');
            } else {
                urgentBtn.classList.remove('bg-primary', 'text-primary-foreground');
                urgentBtn.classList.add('border-primary', 'text-primary', 'bg-background');
            }
            render();
        });
    }

    // Type filter buttons
    const typeFilterBtns = document.querySelectorAll('.type-filter-btn');
    typeFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            state.type = type;
            
            typeFilterBtns.forEach(b => {
                b.classList.remove('bg-primary', 'text-primary-foreground', 'shadow-md');
                b.classList.add('text-muted-foreground', 'hover:text-foreground');
            });
            
            btn.classList.add('bg-primary', 'text-primary-foreground', 'shadow-md');
            btn.classList.remove('text-muted-foreground', 'hover:text-foreground');
            
            render();
        });
    });

    const clearBtn = document.getElementById('clear-filters-main');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => { location.reload(); });
    }
}

// Calculate case stats
function calculateStats(cases) {
    const totalRaised = cases.reduce((sum, c) => sum + parseFloat(c.CASE_COLL_AMOUNT || 0), 0);
    const urgentCount = cases.filter(c => (c.CASE_URGENCY || '').toLowerCase() === 'urgent').length;
    
    // Count treatments and medications - all cases get counted (some might be both)
    let treatmentCount = 0;
    let medicationCount = 0;
    
    cases.forEach(c => {
        if (c.CASE_TYPE) {
            const type = (c.CASE_TYPE + '').toLowerCase().trim();
            if (type.includes('treatment') || type === 'treatment') treatmentCount++;
            else if (type.includes('medication') || type === 'medication') medicationCount++;
        }
    });

    console.log('Total cases:', cases.length, 'Treatment:', treatmentCount, 'Medication:', medicationCount, 'Urgent:', urgentCount);

    const totalStat = document.getElementById('total-cases-stat');
    const urgentStat = document.getElementById('urgent-cases-stat');
    const raisedStat = document.getElementById('total-raised-stat');
    const treatmentBar = document.getElementById('treatment-bar');
    const medicationBar = document.getElementById('medication-bar');
    const treatmentCount_ = document.getElementById('treatment-count-stat');
    const medicationCount_ = document.getElementById('medication-count-stat');

    if (totalStat) totalStat.textContent = cases.length;
    if (urgentStat) urgentStat.textContent = urgentCount;
    if (raisedStat) raisedStat.textContent = '$' + formatCurrency(totalRaised);
    
    const total = treatmentCount + medicationCount || 1;
    if (treatmentBar) treatmentBar.style.width = ((treatmentCount / total) * 100) + '%';
    if (medicationBar) medicationBar.style.width = ((medicationCount / total) * 100) + '%';
    if (treatmentCount_) treatmentCount_.textContent = treatmentCount;
    if (medicationCount_) medicationCount_.textContent = medicationCount;
}

// Main render
function render() {
    const query = (document.getElementById('search-input')?.value || '').toLowerCase();
    let filtered = [...allCampaigns];

    // Filter by search
    if (query) {
        filtered = filtered.filter(c =>
            (c.CASE_TITLE || c.PATIENT_NAME || '').toLowerCase().includes(query) ||
            (c.CASE_DESCRIPTION || '').toLowerCase().includes(query) ||
            (c.PAT_CITY || '').toLowerCase().includes(query)
        );
    }

    // Filter by urgent
    if (state.urgent) {
        filtered = filtered.filter(c => (c.CASE_URGENCY || '').toLowerCase() === 'urgent');
    }

    // Filter by type
    if (state.type !== 'all') {
        filtered = filtered.filter(c => {
            const type = (c.CASE_TYPE || '').toLowerCase().trim();
            if (state.type === 'treatment') return type.includes('treatment') || type === 'treatment';
            if (state.type === 'medication') return type.includes('medication') || type === 'medication';
            return true;
        });
    }

    // Sort
    filtered.sort((a, b) => {
        const dateA = new Date(a.DATE_CREATED || a.SUBMISSION_DATE || a.CASE_CREATED_AT);
        const dateB = new Date(b.DATE_CREATED || b.SUBMISSION_DATE || b.CASE_CREATED_AT);
        return state.sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const noResults = document.getElementById('no-results');
    const resultsCount = document.getElementById('results-count');

    if (filtered.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        if (resultsCount) resultsCount.textContent = '0 cases found';
        return;
    }

    if (noResults) noResults.classList.add('hidden');
    if (resultsCount) resultsCount.textContent = filtered.length + ' case' + (filtered.length !== 1 ? 's' : '') + ' found';

    renderGrid(filtered);
    lucide.createIcons();
}

// Render cases grid (new card logic)
function renderGrid(campaigns) {
    const grid = document.getElementById('cases-grid');
    if (!grid) return;
    grid.innerHTML = '';

    campaigns.forEach((camp, index) => {
        const card = document.createElement('div');
        card.className = 'campaign-card-animated';
        card.style.cssText = `
            display: flex; flex-direction: column; height: 100%; width: 100%;
            background: #ffffff; border-radius: 28px; border: 1px solid #f1f5f9;
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.07); overflow: hidden;
            transition: all 0.5s cubic-bezier(0.2,1,0.3,1); position: relative;
            animation: slide-up 0.5s ease forwards; animation-delay: ${index * 100}ms;
        `;

        // Hover styles
        const style = document.createElement('style');
        style.textContent = `
            .campaign-card-animated:hover { transform: translateY(-12px); box-shadow: 0 30px 60px -12px rgba(225,29,72,0.18); border-color: #fb7185; }
            .campaign-card-animated:hover .card-img { transform: scale(1.1); }
        `;
        card.appendChild(style);

        // Image container
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'height:230px;width:100%;overflow:hidden;position:relative;flex-shrink:0;background:#f1f5f9;';
        const img = document.createElement('img');
        img.src = '../assets/case-1.jpg';
        img.alt = camp.CASE_TITLE || '';
        img.className = 'card-img';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;transition: transform 0.8s ease;';
        img.onerror = () => img.src = 'https://images.unsplash.com/photo-1576091160550-112173f31c77?w=800&q=80';
        imgContainer.appendChild(img);

        // Case type badge
        if (camp.CASE_TYPE) {
            const badge = document.createElement('span');
            badge.textContent = camp.CASE_TYPE.toUpperCase();
            badge.style.cssText = 'background: rgba(255,255,255,0.9);backdrop-filter:blur(8px);color:#1e293b;font-size:10px;font-weight:800;padding:6px 14px;border-radius:12px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.3);position:absolute;top:16px;right:16px;';
            imgContainer.appendChild(badge);
        }

        // Urgent badge
        if ((camp.CASE_URGENCY || '').toLowerCase() === 'urgent') {
            const urgentBadge = document.createElement('span');
            urgentBadge.textContent = '⚠ URGENT';
            urgentBadge.style.cssText = 'background: #e11d48;color:white;font-size:10px;font-weight:800;padding:6px 12px;border-radius:12px;text-transform:uppercase;border:1px solid #be123c;position:absolute;top:16px;left:16px;box-shadow:0 2px 8px rgba(225,29,72,0.4);';
            imgContainer.appendChild(urgentBadge);
        }

        card.appendChild(imgContainer);

        // Card content
        const content = document.createElement('div');
        content.style.cssText = 'padding:28px; display:flex; flex-direction:column; flex-grow:1;';

        // End Date (top-right)
        const percDiv = document.createElement('div');
        percDiv.style.cssText = 'display:flex; justify-content:flex-end; align-items:center; margin-bottom:12px;';
        percDiv.innerHTML = `
            <span style="font-size:13px;color:#64748b;font-weight:600;">${formatDate(camp.CASE_CREATED_AT)}</span>
        `;
        content.appendChild(percDiv);

        // Location & Type
        const locDiv = document.createElement('div');
        locDiv.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8;font-weight:700;margin-bottom:12px;';
        locDiv.innerHTML = `<i data-lucide="map-pin" class="w-3.5 h-3.5"></i>${camp.PAT_CITY || 'Unknown Location'}`;
        content.appendChild(locDiv);

        // Title
        const title = document.createElement('h3');
        title.style.cssText = 'font-weight:800;font-size:21px;color:#0f172a;line-height:1.2;margin-bottom:10px;';
        title.textContent = camp.CASE_TITLE;
        content.appendChild(title);

        // Description
        const desc = document.createElement('p');
        desc.style.cssText = 'font-size:14px;color:#64748b;line-height:1.6;margin-bottom:24px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';
        desc.textContent = camp.CASE_DESCRIPTION;
        content.appendChild(desc);

        // Progress & Buttons container
        const bottomDiv = document.createElement('div');
        bottomDiv.style.cssText = 'margin-top:auto;';

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = 'background:#f8fafc;padding:18px;border-radius:20px;margin-bottom:24px;';
        const raised = parseFloat(camp.CASE_COLL_AMOUNT || 0);
        const goal = parseFloat(camp.CASE_REQ_AMOUNT || 1);
        const progressInner = Math.min((raised / goal) * 100, 100);

        progressContainer.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;">
                <span style="color:#e11d48;font-weight:900;font-size:24px;">$${formatCurrency(raised)}</span>
                <span style="color:#64748b;font-size:13px;font-weight:600;">of $${formatCurrency(goal)}</span>
            </div>
            <div style="height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
                <div style="height:100%;background:linear-gradient(90deg,#e11d48,#fb7185);width:${progressInner}%;border-radius:99px;transition:width 1.5s cubic-bezier(0.34,1.56,0.64,1);"></div>
            </div>
            <div style="font-size:11px;color:#e11d48;font-weight:800;margin-top:8px;text-align:center;">${Math.round(progressInner)}% FUNDED</div>
        `;
        bottomDiv.appendChild(progressContainer);

        // Buttons
        const btnGrid = document.createElement('div');
        btnGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';
        btnGrid.innerHTML = `
            <a href="./case-details.html?id=${camp.CASE_ID}" style="display:flex;align-items:center;justify-content:center;padding:14px;font-size:13px;font-weight:800;color:#1e293b;border:2px solid #e2e8f0;border-radius:18px;text-decoration:none;transition:all 0.3s ease;">View More</a>
            <button onclick="navigateToDonate(${camp.CASE_ID})" style="width:100%;padding:14px;border-radius:18px;background:#e11d48;color:white;font-weight:800;font-size:13px;border:none;cursor:pointer;transition:all 0.3s ease;">Donate</button>
        `;
        bottomDiv.appendChild(btnGrid);

        content.appendChild(bottomDiv);
        card.appendChild(content);
        grid.appendChild(card);
    });
}

// Navigate to donate page
function navigateToDonate(campaignId) {
    window.location.href = `./donate.html?campaign=${campaignId}`;
}

// Helpers
function formatCurrency(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.round(value).toString();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
