// DOM Elements
const providersList = document.getElementById('providers-list');
const providerForm = document.getElementById('provider-form');
const applicationSection = document.getElementById('application-section');
const successSection = document.getElementById('success-section');
const successScreen = document.getElementById('success-screen');
const submitBtn = document.getElementById('submit-btn');
const caseDropdown = document.getElementById('caseToSupport');
const editBtn = document.getElementById('edit-case-btn');
const deleteBtn = document.getElementById('delete-case-btn');
const submitAnotherBtn = document.getElementById('submit-another');

let providerId = null; // Will hold ID for edit

document.addEventListener('DOMContentLoaded', () => {
    fetchProviders();
    fetchCasesForDropdown();
    setupForm();
    setupEditDeleteButtons();
    setupDoctorForms();
    addDoctorForm(); // Add first doctor form by default
});

/**
 * Fetch approved cases to populate the bridge table dropdown
 */
async function fetchCasesForDropdown() {
    try {
        // You'll need a simple PHP script that returns: SELECT CASE_ID, CASE_TITLE FROM MEDICAL_CASE
        const response = await fetch('../api/get_cases_simple.php');
        const data = await response.json();

        if (data.cases && data.cases.length > 0) {
            caseDropdown.innerHTML = '<option value="" disabled selected>Select a case to support</option>';
            data.cases.forEach(c => {
                const option = document.createElement('option');
                option.value = c.CASE_ID;
                option.textContent = c.CASE_TITLE;
                caseDropdown.appendChild(option);
            });
        } else {
            caseDropdown.innerHTML = '<option value="" disabled>No active cases available</option>';
        }
    } catch (error) {
        console.error('Error fetching cases:', error);
        caseDropdown.innerHTML = '<option value="" disabled>Error loading cases</option>';
    }
}

async function fetchProviders() {
    try {
        const response = await fetch('../api/get_providers.php');
        const data = await response.json();

        if (data.providers && data.providers.length > 0) {
            renderProviders(data.providers);
        } else {
            providersList.innerHTML = '<p class="text-center text-muted-foreground p-8">No approved providers listed yet.</p>';
        }
    } catch (error) {
        console.error('Error fetching providers:', error);
        providersList.innerHTML = '<p class="text-center text-muted-foreground p-8">Unable to load providers.</p>';
    }
}

function renderProviders(providers) {
    // Filter to show only providers with assignments (featured providers)
    const featuredProviders = providers.filter(provider => parseInt(provider.total_cases || 0) > 0).slice(0, 6);
    
    if (featuredProviders.length === 0) {
        providersList.innerHTML = '<p class="text-center text-muted-foreground p-8 col-span-full">No featured providers yet.</p>';
        return;
    }

    providersList.innerHTML = featuredProviders.map(provider => {
        return `
        <div class="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/30 transition-colors group">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-hero flex items-center justify-center text-primary-foreground group-hover:scale-105 transition-transform">
                <i data-lucide="${provider.PROVIDER_TYPE === 'Hospital' ? 'building' : 'package'}" class="w-8 h-8"></i>
            </div>
            <div class="flex items-center justify-center gap-2 mb-2">
                <h3 class="font-serif text-xl font-semibold">${provider.PROVIDER_NAME}</h3>
                <div class="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full"><i data-lucide="star" class="w-3 h-3"></i><span class="text-xs font-medium">Featured</span></div>
            </div>
            <p class="text-sm text-muted-foreground mb-4">${provider.PROVIDER_TYPE} • ${provider.PROVIDER_ADDRESS}</p>
            <div class="space-y-2 mb-4">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted-foreground">Cases Supported:</span>
                    <span class="font-semibold text-primary">${provider.total_cases || 0}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-muted-foreground">Total Value:</span>
                    <span class="font-semibold text-primary">$${parseFloat(provider.total_value || 0).toLocaleString()}</span>
                </div>
            </div>
            ${provider.SERVICE_NAME ? `<div class="flex flex-wrap gap-2 justify-center"><span class="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1 rounded-full"><i data-lucide="heart" class="w-3 h-3"></i>${provider.SERVICE_NAME}</span></div>` : ''}
        </div>
        `;
    }).join('');

    lucide.createIcons();
}

/**
 * Setup doctor form dynamic functionality
 */
function setupDoctorForms() {
    const addDoctorBtn = document.getElementById('add-doctor-btn');
    if (addDoctorBtn) {
        addDoctorBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addDoctorForm();
        });
    }
}

function addDoctorForm() {
    const doctorsContainer = document.getElementById('doctors-container');
    const doctorIndex = doctorsContainer.children.length;
    
    const doctorForm = document.createElement('div');
    doctorForm.className = 'rounded-lg border border-border bg-muted/30 p-4 space-y-3';
    doctorForm.id = `doctor-form-${doctorIndex}`;
    doctorForm.innerHTML = `
        <div class="flex items-center justify-between">
            <h4 class="font-semibold text-sm">Doctor ${doctorIndex + 1}</h4>
            ${doctorIndex > 0 ? `<button type="button" class="text-destructive hover:text-destructive/80 transition-colors" onclick="removeDoctorForm(${doctorIndex})">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>` : ''}
        </div>

        <div class="grid md:grid-cols-2 gap-3">
            <div>
                <label class="text-sm font-medium">Doctor Name</label>
                <input type="text" class="doctor-name flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    placeholder="Full name" data-doctor-index="${doctorIndex}">
            </div>

            <div>
                <label class="text-sm font-medium">Specialty</label>
                <select class="doctor-specialty flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                    data-doctor-index="${doctorIndex}">
                    <option value="">Select specialty</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Oncology">Oncology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General Surgery">General Surgery</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Other">Other</option>
                </select>
            </div>
        </div>
    `;

    doctorsContainer.appendChild(doctorForm);
    lucide.createIcons();
}

function removeDoctorForm(index) {
    const doctorForm = document.getElementById(`doctor-form-${index}`);
    if (doctorForm) {
        doctorForm.remove();
    }
}

function setupForm() {
    providerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect doctors data
        const doctorForms = document.querySelectorAll('[id^="doctor-form-"]');
        const doctors = [];
        
        doctorForms.forEach(form => {
            const name = form.querySelector('.doctor-name').value.trim();
            const specialty = form.querySelector('.doctor-specialty').value.trim();
            
            if (name && specialty) {
                doctors.push({ name, specialty });
            }
        });

        if (doctors.length === 0) {
            alert('Please add at least one doctor');
            return;
        }

        const formData = new FormData(providerForm);
        if (providerId) formData.append('editProviderId', providerId); // For update
        
        // Add doctors as JSON
        formData.append('doctors', JSON.stringify(doctors));

        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;

        // UI Feedback
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> ${providerId ? 'Updating...' : 'Submitting...'}`;
        lucide.createIcons();

        try {
            const response = await fetch('../api/register_provider.php', {
                method: 'POST',
                body: formData
            });

            // Log raw response if not JSON to help debugging
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Non-JSON response received:", text);
                throw new Error("Server returned an invalid format.");
            }

            const data = await response.json();

            if (response.ok && data.success) {
                providerId = data.provider_id || providerId; // Store for edit
                // Smooth transition to success screen
                applicationSection.classList.add('hidden');
                successSection.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                alert(providerId ? 'Provider updated successfully!' : 'Provider registered successfully!');
                // Setup the success screen buttons
                setupSuccessScreenButtons();
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during submission. Please check the console.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            lucide.createIcons();
        }
    });
}

function setupSuccessScreenButtons() {
    const editBtn = document.getElementById('edit-case-btn');
    const deleteBtn = document.getElementById('delete-case-btn');
    const submitAnotherBtn = document.getElementById('submit-another');

    if (editBtn) {
        editBtn.onclick = () => {
            // Show form again for editing
            successSection.classList.add('hidden');
            applicationSection.classList.remove('hidden');
            submitBtn.innerHTML = 'Update Application';
            window.scrollTo({ top: document.getElementById('form-container').offsetTop, behavior: 'smooth' });
        };
    }

    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;

            try {
                const response = await fetch(`../api/delete_provider.php?id=${providerId}`);
                const data = await response.json();

                if (response.ok && data.success) {
                    alert('Application withdrawn successfully.');
                    // Reset form and go back
                    providerForm.reset();
                    successSection.classList.add('hidden');
                    applicationSection.classList.remove('hidden');
                    providerId = null;
                    submitBtn.innerHTML = 'Submit Application';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    alert(data.error || 'Failed to withdraw application');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred while withdrawing.');
            }
        };
    }

    if (submitAnotherBtn) {
        submitAnotherBtn.onclick = () => {
            providerForm.reset();
            successSection.classList.add('hidden');
            applicationSection.classList.remove('hidden');
            providerId = null;
            submitBtn.innerHTML = 'Submit Application';
            // Clear doctors container and add one fresh doctor form
            const doctorsContainer = document.getElementById('doctors-container');
            doctorsContainer.innerHTML = '';
            addDoctorForm();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
    }
}

function setupEditDeleteButtons() {
    // This is called on page load for any pre-existing form state
    setupSuccessScreenButtons();
}