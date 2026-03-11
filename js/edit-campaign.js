// Get Campaign ID from URL
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('id');

let campaignData = {};

document.addEventListener('DOMContentLoaded', () => {
    if (!campaignId) {
        window.location.href = './campaigns.html';
        return;
    }
    
    fetchCampaignForEditing();
    setupEventListeners();
});

async function fetchCampaignForEditing() {
    try {
        const response = await fetch(`../api/get_campaign_details.php?id=${campaignId}`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            window.location.href = './campaigns.html';
            return;
        }

        campaignData = data.campaign;
        populateForm();
        renderEvents();
        lucide.createIcons();
    } catch (error) {
        console.error('Error fetching campaign:', error);
        alert('Failed to load campaign');
    }
}

function populateForm() {
    document.getElementById('title').value = campaignData.CAMP_TITLE;
    document.getElementById('description').value = campaignData.CAMP_DESCRIPTION;
    document.getElementById('targetAmount').value = parseFloat(campaignData.TARGET_AMOUNT);
    document.getElementById('targetPeople').value = parseInt(campaignData.NUM_PEOPLE);
    document.getElementById('startDate').value = campaignData.START_DATE;
    document.getElementById('endDate').value = campaignData.END_DATE;
}

function renderEvents() {
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = '';

    if (campaignData.events && campaignData.events.length > 0) {
        campaignData.events.forEach((event, index) => {
            addEventForm(event, index);
        });
    } else {
        addEventForm();
    }
}

function addEventForm(eventData = null, index = 0) {
    const eventsContainer = document.getElementById('events-container');
    const eventIndex = eventsContainer.children.length;
    
    const eventForm = document.createElement('div');
    eventForm.className = 'rounded-lg border border-border bg-muted/30 p-4 space-y-4';
    eventForm.id = `event-form-${eventIndex}`;
    eventForm.innerHTML = `
        <div class="flex items-center justify-between">
            <h4 class="font-semibold">Event ${eventIndex + 1}</h4>
            ${eventIndex > 0 ? `<button type="button" class="text-destructive hover:text-destructive/80 transition-colors" onclick="removeEventForm(${eventIndex})">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>` : ''}
        </div>

        <div class="space-y-3">
            <div>
                <label class="text-sm font-medium">Event Title</label>
                <input type="text" class="event-title flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    placeholder="e.g., Medical Camp" value="${eventData?.EVENT_TITLE || ''}" data-event-index="${eventIndex}">
            </div>

            <div>
                <label class="text-sm font-medium">Event Location</label>
                <input type="text" class="event-location flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Khartoum Hospital" value="${eventData?.EVENT_LOCATION || ''}" data-event-index="${eventIndex}">
            </div>

            <div>
                <label class="text-sm font-medium">Event Date</label>
                <input type="date" class="event-date flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    value="${eventData?.EVENT_DATE || ''}" data-event-index="${eventIndex}">
            </div>
        </div>
    `;

    eventsContainer.appendChild(eventForm);
    lucide.createIcons();
}

function removeEventForm(index) {
    const eventForm = document.getElementById(`event-form-${index}`);
    if (eventForm) {
        eventForm.remove();
    }
}

function setupEventListeners() {
    document.getElementById('edit-campaign-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('add-event-btn').addEventListener('click', (e) => {
        e.preventDefault();
        addEventForm();
    });
    document.getElementById('delete-btn').addEventListener('click', handleDelete);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const targetAmount = parseFloat(document.getElementById('targetAmount').value);
    const targetPeople = parseInt(document.getElementById('targetPeople').value);
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!title || !description || !targetAmount || !targetPeople || !startDate || !endDate) {
        alert('Please fill in all required fields');
        return;
    }

    // Collect event data
    const events = [];
    document.querySelectorAll('[id^="event-form-"]').forEach((form) => {
        const title = form.querySelector('.event-title')?.value.trim();
        const location = form.querySelector('.event-location')?.value.trim();
        const date = form.querySelector('.event-date')?.value;

        if (title || location || date) {
            events.push({ title, location, date });
        }
    });

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('campaign_id', campaignId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('targetAmount', targetAmount);
        formData.append('targetPeople', targetPeople);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('events', JSON.stringify(events));

        const response = await fetch('../api/update_campaign.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert('Campaign updated successfully');
            window.location.href = './campaign-details.html?id=' + campaignId;
        }
    } catch (error) {
        console.error('Error updating campaign:', error);
        alert('Failed to update campaign');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function handleDelete() {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('../api/delete_camp.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ camp_id: campaignId })
        });

        const data = await response.json();

        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            alert('Campaign deleted successfully');
            window.location.href = './campaigns.html';
        }
    } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Failed to delete campaign');
    }
}
