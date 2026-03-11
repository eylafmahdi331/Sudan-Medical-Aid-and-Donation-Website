// State
let allCampaigns = [];
let state = { sort: 'newest' };

document.addEventListener('DOMContentLoaded', () => {
    fetchCampaigns();
    setupEventListeners();
});

async function fetchCampaigns() {
    try {
        const res = await fetch('../api/fetch_campaigns.php');
        const data = await res.json();
        if (data.campaigns) {
            allCampaigns = data.campaigns;
            calculateStats(allCampaigns);
            render();
        }
    } catch (e) {
        const grid = document.getElementById('other-campaigns-grid');
        if (grid) grid.innerHTML = `<p class="col-span-full text-center py-20">Unable to load campaigns.</p>`;
    }
}

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

    const clearBtn = document.getElementById('clear-filters-main');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => { location.reload(); });
    }
}

function calculateStats(campaigns) {
    const totalRaised = campaigns.reduce((sum, c) => sum + parseFloat(c.RAISED_AMOUNT || 0), 0);
    const totalTarget = campaigns.reduce((sum, c) => sum + parseFloat(c.TARGET_AMOUNT || 0), 0);
    // Calculate average progress from individual campaign percentages
    const avgProgress = campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + parseFloat(c.percentage || 0), 0) / campaigns.length 
        : 0;
    
    if (document.getElementById('total-campaigns-stat')) {
        document.getElementById('total-campaigns-stat').textContent = campaigns.length;
    }
    if (document.getElementById('total-raised-stat')) {
        document.getElementById('total-raised-stat').textContent = '$' + formatCurrency(totalRaised);
    }
    if (document.getElementById('avg-progress-stat')) {
        document.getElementById('avg-progress-stat').textContent = Math.round(avgProgress) + '%';
    }
    
    // Fetch donor count
    fetch('../api/get_campaign_stats.php')
        .then(res => res.json())
        .then(data => {
            if (document.getElementById('total-donors-stat')) {
                document.getElementById('total-donors-stat').textContent = data.total_donors.toLocaleString();
            }
        })
        .catch(err => {
            if (document.getElementById('total-donors-stat')) {
                document.getElementById('total-donors-stat').textContent = '0';
            }
        });
}

function render() {
    const searchInput = document.getElementById('search-input');
    const query = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    
    let filtered = [...allCampaigns];
    
    // Filter by search
    if (query) {
        filtered = filtered.filter(c =>
            c.CAMP_TITLE.toLowerCase().includes(query) ||
            c.CAMP_DESCRIPTION.toLowerCase().includes(query) ||
            c.ORG_NAME.toLowerCase().includes(query)
        );
    }
    
    // Sort
    filtered.sort((a, b) => {
        const dateA = new Date(a.START_DATE);
        const dateB = new Date(b.START_DATE);
        
        return state.sort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    const noResults = document.getElementById('no-results');
    const otherSection = document.getElementById('other-campaigns-section');
    
    if (filtered.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        if (otherSection) otherSection.classList.add('hidden');
        return;
    }
    
    if (noResults) noResults.classList.add('hidden');
    if (otherSection) otherSection.classList.remove('hidden');
    
    renderGrid(filtered);
    lucide.createIcons();
}function renderGrid(campaigns) {
    const grid = document.getElementById('other-campaigns-grid');
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
        imgContainer.style.cssText = 'height:200px;width:100%;overflow:hidden;position:relative;flex-shrink:0;background:#f1f5f9;';
        const img = document.createElement('img');
        img.src = '../assets/campaign-cholera.jpg';
        img.alt = camp.CAMP_TITLE || '';
        img.className = 'card-img';
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;transition: transform 0.8s ease;';
        img.onerror = () => img.src = '../assets/campaign-supplies.jpg';
        imgContainer.appendChild(img);

        // Org badge
        if (camp.ORG_NAME) {
            const badge = document.createElement('span');
            badge.textContent = camp.ORG_NAME;
            badge.style.cssText = 'background: rgba(255,255,255,0.9);backdrop-filter:blur(8px);color:#1e293b;font-size:10px;font-weight:800;padding:6px 14px;border-radius:12px;text-transform:uppercase;border:1px solid rgba(255,255,255,0.3);position:absolute;top:16px;right:16px;';
            imgContainer.appendChild(badge);
        }

        card.appendChild(imgContainer);

        // Card content
        const content = document.createElement('div');
        content.style.cssText = 'padding:20px; display:flex; flex-direction:column; flex-grow:1;';

        // End Date (top-right)
        const percDiv = document.createElement('div');
        percDiv.style.cssText = 'display:flex; justify-content:flex-end; align-items:center; margin-bottom:12px;';
        const percentage = Math.min(parseFloat(camp.percentage || 0), 100);
        percDiv.innerHTML = `
            <span style="font-size:13px;color:#64748b;font-weight:600;">${formatDate(camp.END_DATE)}</span>
        `;
        content.appendChild(percDiv);

        // Beneficiaries
        const benDiv = document.createElement('div');
        benDiv.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:#94a3b8;font-weight:700;margin-bottom:12px;';
        benDiv.innerHTML = `<i data-lucide="users" class="w-3.5 h-3.5"></i>${parseInt(camp.NUM_PEOPLE || 0).toLocaleString()} beneficiaries`;
        content.appendChild(benDiv);

        // Title
        const title = document.createElement('h3');
        title.style.cssText = 'font-weight:800;font-size:18px;color:#0f172a;line-height:1.2;margin-bottom:8px;line-clamp:2;';
        title.textContent = camp.CAMP_TITLE;
        content.appendChild(title);

        // Description
        const desc = document.createElement('p');
        desc.style.cssText = 'font-size:13px;color:#64748b;line-height:1.4;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';
        desc.textContent = camp.CAMP_DESCRIPTION;
        content.appendChild(desc);

        // Progress & Buttons container
        const bottomDiv = document.createElement('div');
        bottomDiv.style.cssText = 'margin-top:auto;';

        // Progress bar
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = 'background:#f8fafc;padding:16px;border-radius:16px;margin-bottom:12px;';
        const raised = parseFloat(camp.RAISED_AMOUNT || 0);
        const goal = parseFloat(camp.TARGET_AMOUNT || 1);
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
        btnGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
        btnGrid.innerHTML = `
            <a href="./campaign-details.html?id=${camp.CAMP_ID}" style="display:flex;align-items:center;justify-content:center;padding:12px;font-size:12px;font-weight:800;color:#1e293b;border:2px solid #e2e8f0;border-radius:12px;text-decoration:none;transition:all 0.3s ease;">View More</a>
            <button onclick="navigateToDonate(${camp.CAMP_ID})" style="width:100%;padding:12px;border-radius:12px;background:#e11d48;color:white;font-weight:800;font-size:12px;border:none;cursor:pointer;transition:all 0.3s ease;">Donate</button>
        `;
        bottomDiv.appendChild(btnGrid);

        content.appendChild(bottomDiv);
        card.appendChild(content);
        grid.appendChild(card);
    });
}

function navigateToDonate(campaignId) {
    window.location.href = `./donate.html?campaign=${campaignId}`;
}

function formatCurrency(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
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

