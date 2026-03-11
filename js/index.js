// index.js - render top-supported campaigns and cases on homepage

async function fetchJson(url) {
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error('Fetch error', url, e);
        return null;
    }
}

function createCardForCase(camp) {
    const card = document.createElement('div');
    card.className = 'rounded-xl border bg-card text-card-foreground shadow-card overflow-hidden group hover:shadow-elevated transition-shadow';

    const imgSrc = camp.CASE_IMAGE || './assets/case-1.jpg';

    card.innerHTML = `
        <div class="relative aspect-[4/3] overflow-hidden">
            <img src="${imgSrc}" alt="${escapeHtml(camp.CASE_TITLE || '')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            ${((camp.CASE_URGENCY||'').toLowerCase()==='urgent') ? '<div class="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Urgent</div>' : ''}
            <div class="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full">${escapeHtml(camp.CASE_TYPE || '')}</div>
        </div>
        <div class="p-5">
            <div class="mb-2">
                <h3 class="font-serif font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">${escapeHtml(camp.CASE_TITLE || '')}</h3>
            </div>
            <p class="text-sm text-muted-foreground line-clamp-2 mb-4">${escapeHtml(camp.CASE_DESCRIPTION || '')}</p>

            <div class="flex items-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
                <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i>${escapeHtml(camp.PAT_CITY||'')}</span>
                <span class="text-xs">${escapeHtml(camp.DAYS_LEFT||'')}</span>
            </div>

            <div class="space-y-2">
                <div class="w-full bg-secondary rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full" style="width: ${Math.min((parseFloat(camp.CASE_COLL_AMOUNT||0)/Math.max(parseFloat(camp.CASE_REQ_AMOUNT||1),1))*100,100)}%"></div>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="font-semibold text-primary">$${formatCurrency(parseFloat(camp.CASE_COLL_AMOUNT||0))} raised</span>
                    <span class="text-muted-foreground">of $${formatCurrency(parseFloat(camp.CASE_REQ_AMOUNT||0)||0)}</span>
                </div>
            </div>
        </div>
        <div class="flex items-center p-5 pt-0 gap-2">
            <a href="pages/cases.html" class="flex-1">
                <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-10 px-5 w-full border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground">View Case</button>
            </a>
            <a href="pages/donate.html?case=${camp.CASE_ID}">
                <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-10 w-10 bg-gradient-hero text-primary-foreground shadow-glow"><i data-lucide="heart" class="w-4 h-4"></i></button>
            </a>
        </div>
    `;

    return card;
}

function createCardForCampaign(camp) {
    const card = document.createElement('div');
    card.className = 'rounded-xl border bg-card text-card-foreground shadow-card overflow-hidden group hover:shadow-elevated transition-shadow';
    const imgSrc = camp.CAMP_IMAGE || './assets/campaign-cholera.jpg';
    const raised = parseFloat(camp.RAISED_AMOUNT || 0);
    const goal = parseFloat(camp.TARGET_AMOUNT || 1);
    const pct = Math.min((raised/Math.max(goal,1))*100,100);

    card.innerHTML = `
        <div class="relative aspect-[4/3] overflow-hidden">
            <img src="${imgSrc}" alt="${escapeHtml(camp.CAMP_TITLE||'')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 rounded-full">${escapeHtml(camp.ORG_NAME||'')}</div>
        </div>
        <div class="p-5">
            <div class="mb-2">
                <h3 class="font-serif font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">${escapeHtml(camp.CAMP_TITLE||'')}</h3>
            </div>
            <p class="text-sm text-muted-foreground line-clamp-2 mb-4">${escapeHtml(camp.CAMP_DESCRIPTION||'')}</p>

            <div class="space-y-2">
                <div class="w-full bg-secondary rounded-full h-2">
                    <div class="bg-gradient-hero h-2 rounded-full" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="font-semibold text-primary">$${formatCurrency(raised)} raised</span>
                    <span class="text-muted-foreground">of $${formatCurrency(goal)}</span>
                </div>
            </div>
        </div>
        <div class="flex items-center p-5 pt-0 gap-2">
            <a href="pages/campaigns.html" class="flex-1"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-10 px-5 w-full border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground">Learn More</button></a>
            <a href="pages/donate.html?campaign=${camp.CAMP_ID}" class="flex-1"><button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-10 px-5 w-full bg-gradient-hero text-primary-foreground font-bold shadow-soft">Donate Now</button></a>
        </div>
    `;

    return card;
}

function formatCurrency(value) {
    if (!value) return '0';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return Math.round(value).toString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadHomeLists() {
    const casesData = await fetchJson('api/get_cases.php');
    const campsData = await fetchJson('api/fetch_campaigns.php');

    const casesGrid = document.getElementById('featured-cases-grid');
    const campsGrid = document.getElementById('featured-campaigns-grid');

    if (casesData && casesData.cases && casesGrid) {
        // sort by collected amount desc and take top 3
        const topCases = casesData.cases.sort((a,b)=>parseFloat(b.CASE_COLL_AMOUNT||0)-parseFloat(a.CASE_COLL_AMOUNT||0)).slice(0,3);
        topCases.forEach(c => casesGrid.appendChild(createCardForCase(c)));
    }

    if (campsData && campsData.campaigns && campsGrid) {
        // sort by raised amount desc and take top 2
        const topCamps = campsData.campaigns.sort((a,b)=>parseFloat(b.RAISED_AMOUNT||0)-parseFloat(a.RAISED_AMOUNT||0)).slice(0,2);
        topCamps.forEach(c => campsGrid.appendChild(createCardForCampaign(c)));
    }

    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', loadHomeLists);
