document.addEventListener('DOMContentLoaded', async () => { // Added async here
    // State
    const state = {
        amount: 100,
        frequency: 'one time',
        type: 'general',
        targetId: null,
        targetName: 'General Fund'
    };

    // Elements
    const amountBtns = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('custom-amount');
    const freqBtns = document.querySelectorAll('.freq-btn');
    const monthlyNote = document.getElementById('monthly-note');
    const submitBtn = document.getElementById('submit-btn');
    const submitAmountSpan = document.getElementById('submit-amount');
    const summaryAmount = document.getElementById('summary-amount');
    const summaryTarget = document.getElementById('summary-target');
    const form = document.getElementById('donate-form');
    const mainContent = document.getElementById('main-content');
    const successScreen = document.getElementById('success-screen');

    // Parse URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('case');
    const campaignId = urlParams.get('campaign');

    // --- NEW LOGIC TO FETCH THE TITLE ---
    if (caseId) {
        state.type = 'case';
        state.targetId = caseId;
        await fetchTargetName('case', caseId);
    } else if (campaignId) {
        state.type = 'campaign';
        state.targetId = campaignId;
        await fetchTargetName('campaign', campaignId);
    }

    async function fetchTargetName(type, id) {
    try {
        if (type === 'campaign') {
            // Use the get_campaign_details API for a single, authoritative source
            const response = await fetch(`../api/get_campaign_details.php?id=${id}`);
            const data = await response.json();
            
            if (data.campaign && data.campaign.CAMP_TITLE) {
                state.targetName = data.campaign.CAMP_TITLE;
            } else {
                state.targetName = 'Campaign #' + id;
            }
        } else {
            // type === 'case'
            const response = await fetch(`../api/get-case-details.php?id=${id}`);
            const data = await response.json();

            if (data.case_info && data.case_info.CASE_TITLE) {
                state.targetName = data.case_info.CASE_TITLE;
            } else {
                state.targetName = 'Medical Case #' + id;
            }
        }
    } catch (e) {
        console.error("Error fetching title:", e);
        state.targetName = type === 'campaign' ? 'Campaign #' + id : 'Medical Case #' + id;
    }
    preselectType(state.targetName);
}
    // -------------------------------------

    function preselectType(name) {
        summaryTarget.textContent = name;
        const container = document.getElementById('donation-type-group');
        container.innerHTML = `
            <label class="flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all border-primary bg-primary/5">
                <input type="radio" name="donationType" value="${state.type}" class="accent-primary w-4 h-4" checked>
                <div class="flex-1">
                    <span class="font-medium">Supporting: ${name}</span>
                    <p class="text-sm text-muted-foreground">Direct contribution</p>
                </div>
            </label>
            <label class="flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all border-border hover:border-primary/50 bg-card">
                <input type="radio" name="donationType" value="general" class="accent-primary w-4 h-4">
                <div class="flex-1">
                    <span class="font-medium">General Fund</span>
                    <p class="text-sm text-muted-foreground">Support where needed most</p>
                </div>
            </label>
        `;

        document.getElementsByName('donationType').forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.value === 'general') {
                    state.targetName = 'General Fund';
                } else {
                    state.targetName = name;
                }
                updateSummary();
            });
        });
        updateSummary();
    }

    // Amount Logic
    amountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.amount = parseInt(btn.dataset.amount);
            customAmountInput.value = '';
            updateAmountUI();
        });
    });

    customAmountInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val > 0) {
            state.amount = val;
            updateAmountUI(true);
        }
    });

    function updateAmountUI(isCustom = false) {
        amountBtns.forEach(btn => {
            if (!isCustom && parseInt(btn.dataset.amount) === state.amount) {
                btn.classList.add('border-primary', 'bg-primary', 'text-primary-foreground', 'shadow-glow', 'active');
                btn.classList.remove('border-border', 'hover:border-primary/50', 'bg-card');
            } else {
                btn.classList.remove('border-primary', 'bg-primary', 'text-primary-foreground', 'shadow-glow', 'active');
                btn.classList.add('border-border', 'hover:border-primary/50', 'bg-card');
            }
        });
        updateSummary();
    }

    // Frequency Logic
    freqBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.frequency = btn.dataset.value;
            freqBtns.forEach(b => {
                if (b.dataset.value === state.frequency) {
                    b.classList.add('border-primary', 'bg-primary', 'text-primary-foreground');
                    b.classList.remove('border-border', 'bg-card');
                } else {
                    b.classList.remove('border-primary', 'bg-primary', 'text-primary-foreground');
                    b.classList.add('border-border', 'bg-card');
                }
            });
            monthlyNote.classList.toggle('hidden', state.frequency !== 'monthly');
        });
    });

    function updateSummary() {
        if (submitAmountSpan) submitAmountSpan.textContent = state.amount;
        if (summaryAmount) summaryAmount.textContent = `$${state.amount}`;
        if (summaryTarget) summaryTarget.textContent = state.targetName;
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const requiredIds = ['firstName', 'lastName', 'email', 'cardNumber', 'expiryDate', 'cvv', 'country'];
        let isValid = true;
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el || !el.value.trim()) isValid = false;
        });

        if (!isValid) {
            alert('Please fill in all required fields.');
            return;
        }

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Processing...';

        try {
          const formData = new FormData();
formData.append('donation_amount', state.amount);
formData.append('donation_type', state.type); // general, case, campaign
if (state.type !== 'general') {
formData.append('related_id', state.targetId); // only send for case/campaign
}
formData.append('first_name', document.getElementById('firstName').value);
formData.append('last_name', document.getElementById('lastName').value);
formData.append('email', document.getElementById('email').value);
formData.append('phone', document.getElementById('phone')?.value ?? '');
formData.append('country', document.getElementById('country')?.value ?? '');
formData.append('is_anonymous', document.getElementById('anonymous')?.checked ? 1 : 0);
// Add payment method data
const activeMethod = document.querySelector('.payment-method-btn.active');
if (activeMethod) {
    formData.append('payment_method', activeMethod.dataset.method || 'credit');
}
formData.append('card_number', document.getElementById('cardNumber')?.value ?? '');
formData.append('expiry_date', document.getElementById('expiryDate')?.value ?? '');
formData.append('cvv', document.getElementById('cvv')?.value ?? '');

            const response = await fetch('../api/donate_submit.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
               // Update success screen dynamically
const successAmountEl = document.getElementById('success-amount');
const successNameEl = document.getElementById('success-name');
const successTargetEl = document.getElementById('success-target');

if (successAmountEl) successAmountEl.textContent = `$${state.amount}`;

const firstName = document.getElementById('firstName')?.value;
if (successNameEl && firstName && !document.getElementById('anonymous')?.checked) {
    successNameEl.textContent = `, ${firstName}`;
} else if (successNameEl) {
    successNameEl.textContent = '';
}

if (successTargetEl) {
    successTargetEl.textContent = state.targetName;
}

mainContent.classList.add('hidden');
document.querySelector('.bg-gradient-hero')?.classList.add('hidden');
successScreen.classList.remove('hidden');
window.scrollTo(0, 0);
            } else {
                alert(data.error || 'Donation failed');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Payment Method UI Toggle
    const methodBtns = document.querySelectorAll('.payment-method-btn');
    methodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            methodBtns.forEach(b => {
                b.classList.remove('border-primary', 'bg-primary/5', 'active');
                b.classList.add('border-border');
            });
            btn.classList.add('border-primary', 'bg-primary/5', 'active');
            btn.classList.remove('border-border');
        });
    });
});