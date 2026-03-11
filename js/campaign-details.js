// Get Campaign ID from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('id');

let campaignData = {};
let donorsData = [];
let currentTab = 'about';

document.addEventListener('DOMContentLoaded', () => {
    if (!campaignId) {
        window.location.href = './campaigns.html';
        return;
    }
    
    fetchCampaignDetails();
    setupEventListeners();
});

async function fetchCampaignDetails() {
    try {
        const response = await fetch(`../api/get_campaign_details.php?id=${campaignId}`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            window.location.href = './campaigns.html';
            return;
        }

        campaignData = data.campaign;
        donorsData = data.donors || [];
        
        renderCampaignDetails();
        renderTabContent('about');
        updateDonorCount();
        lucide.createIcons();
    } catch (error) {
        console.error('Error fetching campaign:', error);
        alert('Failed to load campaign details');
    }
}

function renderCampaignDetails() {
    // Update basic info
    if (document.getElementById('campaign-title')) {
        document.getElementById('campaign-title').textContent = campaignData.CAMP_TITLE || 'Campaign';
    }
    
    // Set image - use a placeholder since schema doesn't have COVER_IMAGE
    const imageEl = document.getElementById('campaign-image');
    if (imageEl) {
        imageEl.src = 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=600&fit=crop';
        imageEl.onerror = function() {
            this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.style.color = 'white';
            this.textContent = campaignData.CAMP_TITLE;
        };
    }
    
    if (document.getElementById('organization-tag')) {
        document.getElementById('organization-tag').textContent = campaignData.ORG_NAME || 'Organization';
    }
    if (document.getElementById('campaign-end-date')) {
        document.getElementById('campaign-end-date').textContent = formatDate(campaignData.END_DATE);
    }
    if (document.getElementById('campaign-target-people')) {
        document.getElementById('campaign-target-people').textContent = parseInt(campaignData.NUM_PEOPLE).toLocaleString();
    }
    if (document.getElementById('campaign-is-active')) {
        document.getElementById('campaign-is-active').textContent = campaignData.CAMP_IS_ACTIVE ? 'Active' : 'Inactive';
    }
    if (document.getElementById('campaign-status')) {
        document.getElementById('campaign-status').textContent = campaignData.CAMP_IS_ACTIVE ? 'Active' : 'Inactive';
    }

    // Update fundraising info
    const raised = parseFloat(campaignData.RAISED_AMOUNT || 0);
    const goal = parseFloat(campaignData.TARGET_AMOUNT || 1);
    const percentage = Math.min((raised / goal) * 100, 100);

    if (document.getElementById('amount-raised')) {
        document.getElementById('amount-raised').textContent = '$' + raised.toLocaleString('en-US', {minimumFractionDigits: 0});
    }
    if (document.getElementById('amount-goal')) {
        document.getElementById('amount-goal').textContent = `of $${goal.toLocaleString('en-US', {minimumFractionDigits: 0})}`;
    }
    if (document.getElementById('progress-bar')) {
        document.getElementById('progress-bar').style.width = percentage + '%';
    }
    if (document.getElementById('progress-percent')) {
        document.getElementById('progress-percent').textContent = Math.round(percentage);
    }

    // Update page title
    document.title = `${campaignData.CAMP_TITLE || 'Campaign'} - Sudan Medical Aid`;
}

function renderTabContent(tab) {
    currentTab = tab;
    const tabContent = document.getElementById('tab-content');

    if (tab === 'about') {
        tabContent.innerHTML = `
            <div class="space-y-8">
                <div>
                    <h3 class="font-serif text-2xl font-bold mb-4">Campaign Description</h3>
                    <p class="text-muted-foreground leading-relaxed whitespace-pre-wrap">${escapeHtml(campaignData.CAMP_DESCRIPTION)}</p>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    <div class="rounded-lg bg-muted/50 p-6">
                        <p class="text-sm text-muted-foreground uppercase font-semibold mb-2">Start Date</p>
                        <p class="font-semibold text-lg">${formatDate(campaignData.START_DATE)}</p>
                    </div>
                    <div class="rounded-lg bg-muted/50 p-6">
                        <p class="text-sm text-muted-foreground uppercase font-semibold mb-2">End Date</p>
                        <p class="font-semibold text-lg">${formatDate(campaignData.END_DATE)}</p>
                    </div>
                    <div class="rounded-lg bg-muted/50 p-6">
                        <p class="text-sm text-muted-foreground uppercase font-semibold mb-2">Target Beneficiaries</p>
                        <p class="font-semibold text-lg">${parseInt(campaignData.NUM_PEOPLE).toLocaleString()}</p>
                    </div>
                    <div class="rounded-lg bg-muted/50 p-6">
                        <p class="text-sm text-muted-foreground uppercase font-semibold mb-2">Fundraising Goal</p>
                        <p class="font-semibold text-lg">$${parseFloat(campaignData.TARGET_AMOUNT).toLocaleString('en-US', {minimumFractionDigits: 0})}</p>
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'organization') {
        tabContent.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h3 class="font-serif text-2xl font-bold mb-4">${escapeHtml(campaignData.ORG_NAME)}</h3>
                    <div class="rounded-lg bg-success/10 border border-success/30 p-4 flex items-start gap-3 mb-6">
                        <i data-lucide="check-circle-2" class="w-5 h-5 text-success mt-0.5 flex-shrink-0"></i>
                        <div class="text-sm">
                            <p class="font-medium text-foreground">Trusted Partner</p>
                            <p class="text-muted-foreground">
                                This organization has been verified and approved by the Sudanese Red Crescent Society.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3 text-muted-foreground">
                        <i data-lucide="map-pin" class="w-5 h-5 text-primary"></i>
                        <span>Operating in Sudan</span>
                    </div>
                    <div>
                        <p class="text-sm text-muted-foreground uppercase font-semibold mb-2">Organization Type</p>
                        <p class="font-semibold">${escapeHtml(campaignData.ORG_TYPE)}</p>
                    </div>
                    <div>
                        <p class="text-sm text-muted-foreground uppercase font-semibold mb-2">About the Organization</p>
                        <p class="text-muted-foreground leading-relaxed">${escapeHtml(campaignData.ORG_INFO)}</p>
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'events') {
        if (!campaignData.events || campaignData.events.length === 0) {
            tabContent.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="calendar" class="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50"></i>
                    <p class="text-muted-foreground">No events scheduled for this campaign</p>
                </div>
            `;
        } else {
            let eventsHtml = '<div class="space-y-4">';
            campaignData.events.forEach(event => {
                eventsHtml += `
                    <div class="rounded-lg border border-border p-6 bg-muted/30">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex-1">
                                <h4 class="font-semibold text-lg mb-2">${escapeHtml(event.EVENT_TITLE || 'Untitled Event')}</h4>
                                <div class="space-y-2 text-sm text-muted-foreground">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="calendar" class="w-4 h-4"></i>
                                        <span>${formatDate(event.EVENT_DATE)}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="map-pin" class="w-4 h-4"></i>
                                        <span>${escapeHtml(event.EVENT_LOCATION || 'TBD')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            eventsHtml += '</div>';
            tabContent.innerHTML = eventsHtml;
        }
    } else if (tab === 'donors') {
        if (donorsData.length === 0) {
            tabContent.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="heart" class="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50"></i>
                    <p class="text-muted-foreground">Be the first to donate to this campaign</p>
                </div>
            `;
        } else {
            let donorsHtml = '<div class="space-y-3">';
            donorsData.forEach(donor => {
                const isAnonymous = donor.IS_ANONYMOUS === 1 || donor.IS_ANONYMOUS === '1' || donor.IS_ANONYMOUS === true;
                const donorName = isAnonymous ? 'Anonymous Donor' : `${escapeHtml(donor.DONOR_FIRST_NAME || 'Donor')} ${escapeHtml(donor.DONOR_LAST_NAME || '')}`.trim();
                donorsHtml += `
                    <div class="rounded-lg border border-border p-4 bg-muted/30 flex items-center justify-between">
                        <div class="flex-1">
                            <p class="font-semibold">${donorName}</p>
                            <p class="text-xs text-muted-foreground">Donated $${parseFloat(donor.DONATION_AMOUNT).toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                        </div>
                        <p class="text-xs text-muted-foreground">${formatDate(donor.DONATION_DATE)}</p>
                    </div>
                `;
            });
            donorsHtml += '</div>';
            tabContent.innerHTML = donorsHtml;
        }
    }

    lucide.createIcons();
}

function switchTab(tab) {
    // Update button styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-primary', 'bg-muted/50');
        btn.classList.add('border-transparent', 'text-muted-foreground', 'hover:bg-muted/30');
    });
    document.getElementById(`tab-${tab}`).classList.add('border-primary', 'text-foreground', 'bg-muted/50');
    document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-muted-foreground', 'hover:bg-muted/30');

    renderTabContent(tab);
}

function updateDonorCount() {
    document.getElementById('campaign-donors-count').textContent = donorsData.length;
    document.getElementById('donors-list-count').textContent = donorsData.length;
}

function setupEventListeners() {
    // Donate button
    const donateBtn = document.getElementById('donate-btn');
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            window.location.href = `./donate.html?campaign=${campaignId}`;
        });
    }

    // Share button
    document.getElementById('share-btn').addEventListener('click', () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link).then(() => {
            alert('Campaign link copied to clipboard!');
        });
    });

    // Quick donate buttons
    window.donateAmount = function(amount) {
        window.location.href = `./donate.html?campaign=${campaignId}`;
    };
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
