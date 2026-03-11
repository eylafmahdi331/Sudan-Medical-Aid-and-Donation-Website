// Form data storage
let createdCampaignId = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    addEventForm(); // Add first event form by default
});

function setupEventListeners() {
    // Form submission
    document.getElementById('create-campaign-form').addEventListener('submit', handleFormSubmit);

    // Add event button
    document.getElementById('add-event-btn').addEventListener('click', addEventForm);

    // Success screen buttons
    document.getElementById('home-btn').addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    document.getElementById('view-campaign-btn').addEventListener('click', () => {
        if (createdCampaignId) {
            window.location.href = `./campaign-details.html?id=${createdCampaignId}`;
        }
    });

    document.getElementById('submit-another-btn').addEventListener('click', () => {
        location.reload();
    });

    document.getElementById('edit-btn').addEventListener('click', () => {
        if (createdCampaignId) {
            window.location.href = `./edit-campaign.html?id=${createdCampaignId}`;
        }
    });

    document.getElementById('delete-btn').addEventListener('click', () => {
        if (createdCampaignId) {
            if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
                deleteCampaign(createdCampaignId);
            }
        }
    });

    // Media upload handling
    setupMediaUpload();
}

function setupMediaUpload() {
    const dropZone = document.getElementById('drop-zone');
    const mediaUpload = document.getElementById('mediaUpload');
    const browseBtn = document.getElementById('browse-btn');

    browseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        mediaUpload.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary/50');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary/50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary/50');
        if (e.dataTransfer.files.length) {
            mediaUpload.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    mediaUpload.addEventListener('change', handleFileSelect);
}

function handleFileSelect() {
    const mediaUpload = document.getElementById('mediaUpload');
    const uploadPrompt = document.getElementById('upload-prompt');
    const filePreview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileType = document.getElementById('file-type');
    const removeFileBtn = document.getElementById('remove-file-btn');

    if (mediaUpload.files.length > 0) {
        const file = mediaUpload.files[0];
        fileName.textContent = file.name;
        fileType.textContent = (file.type.startsWith('video/') ? '🎥 Video' : '📷 Image') + ' selected';
        uploadPrompt.classList.add('hidden');
        filePreview.classList.remove('hidden');

        removeFileBtn.addEventListener('click', () => {
            mediaUpload.value = '';
            uploadPrompt.classList.remove('hidden');
            filePreview.classList.add('hidden');
        });
    }
}

function addEventForm() {
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
                    placeholder="e.g., Medical Camp in Khartoum" data-event-index="${eventIndex}">
            </div>

            <div>
                <label class="text-sm font-medium">Event Location</label>
                <input type="text" class="event-location flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="e.g., Khartoum Hospital, Central District" data-event-index="${eventIndex}">
            </div>

            <div>
                <label class="text-sm font-medium">Event Date</label>
                <input type="date" class="event-date flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    data-event-index="${eventIndex}">
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

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            mediaUpload.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });


async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');

    // Validate required fields
    const orgName = document.getElementById('orgName')?.value.trim() || '';
    const orgType = document.getElementById('orgType')?.value || '';
    const orgNum = document.getElementById('orgNum')?.value.trim() || '';
    const title = document.getElementById('title')?.value.trim() || '';
    const description = document.getElementById('description')?.value.trim() || '';
    const targetAmount = parseFloat(document.getElementById('targetAmount')?.value || 0);
    const targetPeople = parseInt(document.getElementById('targetPeople')?.value || 0);
    const startDate = document.getElementById('startDate')?.value || '';
    const endDate = document.getElementById('endDate')?.value || '';

    console.log({orgName, orgType, orgNum, title, description, targetAmount, targetPeople, startDate, endDate});

    if (!orgName || !orgType || !orgNum || !title || !description || !targetAmount || !targetPeople || !startDate || !endDate) {
        alert('Please fill in all required fields. Missing: ' + 
            (!orgName ? 'Org Name ' : '') +
            (!orgType ? 'Org Type ' : '') +
            (!orgNum ? 'Org Number ' : '') +
            (!title ? 'Title ' : '') +
            (!description ? 'Description ' : '') +
            (!targetAmount ? 'Target Amount ' : '') +
            (!targetPeople ? 'Target People ' : '') +
            (!startDate ? 'Start Date ' : '') +
            (!endDate ? 'End Date ' : '')
        );
        return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
        alert('End date must be after start date');
        return;
    }

    // Verify organization first
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    
    try {
        console.log('Verifying organization...');
        const verifyFormData = new FormData();
        verifyFormData.append('orgName', orgName);
        verifyFormData.append('orgType', orgType);
        verifyFormData.append('orgNum', orgNum);
        
        const verifyResponse = await fetch('../api/verify_organization.php', {
            method: 'POST',
            body: verifyFormData
        });
        
        const verifyData = await verifyResponse.json();
        console.log('Organization verification:', verifyData);
        
        if (!verifyData.verified) {
            alert('Organization Verification Failed:\n' + (verifyData.error || 'Unknown error'));
            submitBtn.disabled = false;
            return;
        }
        
        console.log('Organization verified! Proceeding with campaign creation...');
        
    } catch (error) {
        console.error('Organization verification error:', error);
        alert('Failed to verify organization. Error: ' + error.message);
        submitBtn.disabled = false;
        return;
    }

    // Collect event data
    const campaignEvents = [];
    document.querySelectorAll('[id^="event-form-"]').forEach((form, index) => {
        const eventTitle = form.querySelector('.event-title')?.value.trim();
        const location = form.querySelector('.event-location')?.value.trim();
        const date = form.querySelector('.event-date')?.value;

        if (eventTitle || location || date) {
            campaignEvents.push({
                title: eventTitle,
                location,
                date
            });
        }
    });

    // Prepare form data
    const formDataToSend = new FormData();
    formDataToSend.append('orgName', orgName);
    formDataToSend.append('orgType', orgType);
    formDataToSend.append('orgNum', orgNum);
    formDataToSend.append('title', title);
    formDataToSend.append('description', description);
    formDataToSend.append('targetAmount', targetAmount);
    formDataToSend.append('targetPeople', targetPeople);
    formDataToSend.append('startDate', startDate);
    formDataToSend.append('endDate', endDate);
    formDataToSend.append('events', JSON.stringify(campaignEvents));

    // Add media file if selected
    const mediaUpload = document.getElementById('mediaUpload');
    if (mediaUpload && mediaUpload.files.length > 0) {
        formDataToSend.append('media', mediaUpload.files[0]);
    }

    try {
        console.log('Submitting campaign to API...');
        const response = await fetch('../api/create_campaign.php', {
            method: 'POST',
            body: formDataToSend
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.campaign_id) {
            createdCampaignId = data.campaign_id;
            console.log('Success! Campaign ID:', createdCampaignId);
            showSuccessScreen(title);
        } else {
            if (response.status === 401) {
                alert('You must be logged in to create a campaign.');
                window.location.href = 'auth.html';
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
                console.error('Error data:', data);
            }
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error submitting campaign:', error);
        alert('Failed to submit campaign. Please check console for details: ' + error.message);
        submitBtn.disabled = false;
    }
}

function showSuccessScreen(campaignTitle) {
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('success-screen').classList.remove('hidden');
    document.getElementById('success-title').textContent = campaignTitle;
    window.scrollTo(0, 0);
}

function showSuccessScreen(campaignTitle) {
    document.getElementById('form-section').classList.add('hidden');
    document.getElementById('success-screen').classList.remove('hidden');
    document.getElementById('success-title').textContent = campaignTitle;

    // Scroll to top
    window.scrollTo(0, 0);
}

async function deleteCampaign(campaignId) {
    try {
        const response = await fetch('../api/delete_camp.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
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
        alert('Failed to delete campaign. Please try again.');
    }
}