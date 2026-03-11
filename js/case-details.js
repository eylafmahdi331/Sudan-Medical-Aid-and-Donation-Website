let caseData = null;
let currentTab = 'donors';

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('id');

    if (!caseId) {
        document.getElementById('tab-content').innerHTML = '<div class="text-center text-muted-foreground"><p>No case ID provided in URL</p></div>';
        return;
    }

    fetchCaseDetails(caseId);
    setupEventListeners();
});

async function fetchCaseDetails(caseId) {
    try {
        console.log('Fetching case details for ID:', caseId);
        
        // Use absolute path to avoid relative path issues
        const apiPath = `/sudan-medical-aid/sudan-medical-aid/api/get-case-details.php?id=${caseId}`;
        console.log('API Path:', apiPath);
        
        const res = await fetch(apiPath);
        
        console.log('Response status:', res.status, 'ok:', res.ok);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const text = await res.text();
        console.log('Raw response:', text);
        
        const data = JSON.parse(text);
        
        console.log('Parsed API Response:', data);

        if (data.error) {
            console.error('API Error:', data.error);
            document.getElementById('tab-content').innerHTML = `<div class="text-center text-red-600"><p>${data.error}</p></div>`;
            return;
        }

        caseData = data;
        console.log('Case data set:', caseData);
        populatePageData();
        
    } catch (e) {
        console.error("Fetch failed:", e);
        console.error("Error stack:", e.stack);
        if (document.getElementById('tab-content')) {
            document.getElementById('tab-content').innerHTML = '<div class="text-center text-red-600"><p>Failed to load case details: ' + e.message + '</p></div>';
        }
    }
}

function populatePageData() {
    try {
        const info = caseData.case_info;
        
        console.log('Populating page data with:', info);
        
        // Helper function to safely set element text
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                console.log(`Set ${id} to:`, value);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        };
        
        // Title and Type
        setText('case-title', info.CASE_TITLE || 'Case');
        setText('case-urgency', (info.CASE_URGENCY || 'Standard').toUpperCase());
        setText('case-type', info.CASE_TYPE || 'Treatment');
        
        // Specialty tag
        if (info.SPECIALTY) {
            setText('specialty-tag', info.SPECIALTY);
        }

        // Location and Date - in icons section
        setText('case-city-small', info.PAT_CITY || 'Sudan');
        if (info.CASE_CREATED_AT) {
            const date = new Date(info.CASE_CREATED_AT);
            const dateStr = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            setText('case-date-small', dateStr);
        }

        // Description is now rendered in the About tab
        // Donors count
        const donorCount = caseData.donors ? caseData.donors.length : 0;
        console.log('Donor count:', donorCount);
        setText('case-donors-small', donorCount.toString());
        setText('donors-list-count', donorCount.toString());

        // Updates count
        const updateCount = caseData.updates ? caseData.updates.length : 0;
        setText('updates-list-count', updateCount.toString());

        // Fundraising amounts
        const raised = parseFloat(info.CASE_COLL_AMOUNT || 0);
        const goal = parseFloat(info.CASE_REQ_AMOUNT || 1);
        const percent = Math.min((raised / goal) * 100, 100);

        console.log('Amounts - Raised:', raised, 'Goal:', goal, 'Percent:', percent);

        const raisedEl = document.getElementById('amount-raised');
        if (raisedEl) {
            raisedEl.textContent = '$' + raised.toLocaleString('en-US', { maximumFractionDigits: 0 });
            console.log('Set amount-raised to:', raisedEl.textContent);
        }
        
        const goalEl = document.getElementById('amount-goal');
        if (goalEl) {
            goalEl.textContent = 'of $' + goal.toLocaleString('en-US', { maximumFractionDigits: 0 });
            console.log('Set amount-goal to:', goalEl.textContent);
        }
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = percent + '%';
            console.log('Set progress bar width to:', percent + '%');
        }
        
        const progressPercent = document.getElementById('progress-percent');
        if (progressPercent) {
            progressPercent.textContent = Math.round(percent).toString();
            console.log('Set progress-percent to:', Math.round(percent));
        }

        // Case image with fallback (normalize and encode uploaded path)
        const caseImageEl = document.getElementById('case-image');
        if (caseImageEl) {
            const localDefault = '../assets/case-1.jpg';
            try {
                if (caseData.image) {
                    // Normalize backslashes to forward slashes
                    let normalized = caseData.image.replace(/\\/g, '/');
                    // Remove any leading ../ or ./ segments
                    normalized = normalized.replace(/^(\.\/|\.\.\/)*/g, '');
                    // Resolve uploads path without duplicating site base
                    const siteBase = '/sudan-medical-aid/sudan-medical-aid';

                    // If path already contains full siteBase, use as-is
                    if (normalized.startsWith(siteBase)) {
                        // nothing
                    } else if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
                        // direct uploads path; ensure leading slash and prepend siteBase
                        if (!normalized.startsWith('/')) normalized = '/' + normalized;
                        normalized = siteBase.replace(/\/$/, '') + normalized;
                    } else if (normalized.includes('/uploads/')) {
                        // path contains uploads somewhere (e.g., ../uploads/...); extract from /uploads onward
                        const idx = normalized.indexOf('/uploads/');
                        if (idx !== -1) {
                            normalized = siteBase.replace(/\/$/, '') + normalized.substring(idx);
                        } else {
                            // fallback: prepend siteBase
                            if (!normalized.startsWith('/')) normalized = '/' + normalized;
                            normalized = siteBase.replace(/\/$/, '') + normalized;
                        }
                    } else {
                        // If normalized starts with http or absolute path, leave it; otherwise prepend site base
                        if (!normalized.match(/^https?:\/\//) && !normalized.startsWith('/')) {
                            normalized = siteBase.replace(/\/$/, '') + '/' + normalized;
                        }
                    }

                    caseImageEl.src = encodeURI(normalized);
                    console.log('Using image src:', normalized);
                } else {
                    caseImageEl.src = localDefault;
                    console.log('Using local default image');
                }
            } catch (e) {
                console.error('Error setting case image, using local default:', e);
                caseImageEl.src = localDefault;
            }
        }

        // Status
        setText('case-status', (info.CASE_STATUS || 'Active').charAt(0).toUpperCase() + (info.CASE_STATUS || 'Active').slice(1));

        // Initialize with About tab
        switchTab('about');

        lucide.createIcons();
    } catch (e) {
        console.error('Error in populatePageData:', e);
        document.getElementById('tab-content').innerHTML = '<div class="text-center text-red-600"><p>Error populating page data: ' + e.message + '</p></div>';
    }
}

function switchTab(tab) {
    try {
        currentTab = tab;
        console.log('Switching to tab:', tab);
        
        // Update active tab styling
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('border-primary', 'text-foreground', 'bg-muted/50');
            btn.classList.add('border-transparent', 'text-muted-foreground', 'hover:bg-muted/30');
        });
        
        const activeBtn = document.getElementById(`tab-${tab}`);
        if (activeBtn) {
            activeBtn.classList.remove('border-transparent', 'text-muted-foreground', 'hover:bg-muted/30');
            activeBtn.classList.add('border-primary', 'text-foreground', 'bg-muted/50');
        }

        const content = document.getElementById('tab-content');
        if (!content) {
            console.error('tab-content element not found');
            return;
        }
        
        content.classList.remove('animate-fade-in');
        
        if (tab === 'about') {
            renderAboutTab();
        } else if (tab === 'donors') {
            renderDonorsTab();
        } else if (tab === 'updates') {
            renderUpdatesTab();
        }

        setTimeout(() => content.classList.add('animate-fade-in'), 10);
        lucide.createIcons();
    } catch (e) {
        console.error('Error in switchTab:', e);
    }
}

function renderAboutTab() {
    try {
        const content = document.getElementById('tab-content');
        const info = caseData.case_info;
        
        console.log('Rendering about tab with info:', info);
        
        content.innerHTML = `
            <div class="prose prose-invert max-w-none">
                <h3 class="font-serif text-2xl font-bold mb-4">About This Case</h3>
                <p class="text-muted-foreground leading-relaxed text-lg">${info.CASE_DESCRIPTION || 'No description available'}</p>
                
                <div class="mt-8 grid md:grid-cols-2 gap-6">
                    <div class="border border-border rounded-lg p-4">
                        <p class="text-xs text-muted-foreground uppercase font-semibold mb-2">Case Type</p>
                        <p class="text-lg font-semibold">${info.CASE_TYPE || '-'}</p>
                    </div>
                    <div class="border border-border rounded-lg p-4">
                        <p class="text-xs text-muted-foreground uppercase font-semibold mb-2">Urgency</p>
                        <p class="text-lg font-semibold text-primary uppercase">${info.CASE_URGENCY || '-'}</p>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    } catch (e) {
        console.error('Error in renderAboutTab:', e);
        document.getElementById('tab-content').innerHTML = '<p class="text-red-600">Error loading about section</p>';
    }
}

function renderDonorsTab() {
    const content = document.getElementById('tab-content');
    const donors = caseData.donors || [];

    if (donors.length === 0) {
        content.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="heart" class="w-12 h-12 mx-auto text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground text-lg">No donors yet</p>
                <p class="text-sm text-muted-foreground mt-2">Be the first to donate and make a difference!</p>
            </div>
        `;
        return;
    }

    let html = '<div class="space-y-3">';
    donors.forEach(donor => {
        const date = new Date(donor.DONATION_DATE);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const amount = parseFloat(donor.DONATION_AMOUNT || 0);
        
        const isAnonymous = donor.IS_ANONYMOUS === 1 || donor.IS_ANONYMOUS === '1' || donor.IS_ANONYMOUS === true;
        const donorName = isAnonymous ? 'Anonymous Donor' : `${escapeHtml(donor.DONOR_FIRST_NAME || 'Donor')} ${escapeHtml(donor.DONOR_LAST_NAME || '')}`.trim();
        const nameInitial = isAnonymous ? 'A' : (donor.DONOR_FIRST_NAME?.charAt(0) || 'D').toUpperCase();
        
        html += `
            <div class="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                        ${nameInitial}
                    </div>
                    <div>
                        <p class="font-semibold">${donorName}</p>
                        <p class="text-xs text-muted-foreground">${dateStr}</p>
                    </div>
                </div>
                <p class="font-bold text-primary text-lg">$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
        `;
    });
    html += '</div>';
    
    content.innerHTML = html;
    lucide.createIcons();
}

function renderUpdatesTab() {
    const content = document.getElementById('tab-content');
    const updates = caseData.updates || [];

    if (updates.length === 0) {
        content.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="bell" class="w-12 h-12 mx-auto text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground text-lg">No updates yet</p>
                <p class="text-sm text-muted-foreground mt-2">Check back later for progress updates</p>
            </div>
        `;
        return;
    }

    let html = '<div class="space-y-6">';
    updates.forEach((update, idx) => {
        const date = new Date(update.UPDATE_DATE);
        const dateStr = date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric' 
        });
        
        html += `
            <div class="border-l-4 border-primary pl-6 pb-6 relative">
                <div class="absolute -left-3 top-0 w-4 h-4 rounded-full bg-gradient-hero border-4 border-background"></div>
                <div class="mb-2 flex items-center justify-between">
                    <h4 class="font-semibold text-lg">Case Update</h4>
                    <span class="text-xs text-muted-foreground">${dateStr}</span>
                </div>
                <p class="text-muted-foreground leading-relaxed">${update.UPDATE_CONTENT || 'No description'}</p>
            </div>
        `;
    });
    html += '</div>';
    
    content.innerHTML = html;
    lucide.createIcons();
}

function renderDonorsInline() {
    // This function is no longer needed but kept for reference
}

function renderUpdatesInline() {
    // This function is no longer needed but kept for reference
}

function setupEventListeners() {
    // Donate button
    const donateBtn = document.getElementById('donate-btn');
    if (donateBtn) {
        donateBtn.addEventListener('click', () => {
            const amount = document.getElementById('custom-amount').value || 100;
            const caseId = new URLSearchParams(window.location.search).get('id');
            window.location.href = `./donate.html?case=${caseId}&amount=${amount}`;
        });
    }

    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const currentUrl = window.location.href;
            navigator.clipboard.writeText(currentUrl).then(() => {
                const btn = document.getElementById('share-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    lucide.createIcons();
                }, 2000);
            }).catch(err => {
                alert('Failed to copy link');
                console.error(err);
            });
        });
    }

    // Quick donate amounts
    window.donateAmount = function(amount) {
        document.getElementById('custom-amount').value = amount;
    };
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toLocaleString('en-US', { maximumFractionDigits: 2 });
}