document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('submit-case-form');
    if (!form) return;

    const formSection = document.getElementById('form-section');
    const successScreen = document.getElementById('success-screen');
    const treatmentFields = document.getElementById('treatment-fields');
    const medicationFields = document.getElementById('medication-fields');

    let caseId = null;
    let hasSubmitted = false;

    function showSuccessScreen(caseTitle) {
        if (formSection) formSection.classList.add('hidden');
        if (successScreen) successScreen.classList.remove('hidden');
        const titleEl = document.getElementById('success-title');
        if (titleEl) titleEl.textContent = caseTitle || 'Your case';
        window.scrollTo(0, 0);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function showFormAgain() {
        if (successScreen) successScreen.classList.add('hidden');
        if (formSection) formSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // Success screen buttons
    const homeBtn = document.getElementById('home-btn');
    if (homeBtn) homeBtn.addEventListener('click', () => { window.location.href = '../index.html'; });

    const viewCaseBtn = document.getElementById('view-case-btn');
    if (viewCaseBtn) {
        viewCaseBtn.addEventListener('click', () => {
            if (caseId) window.location.href = `./case-details.html?id=${caseId}`;
        });
    }

    const submitAnotherBtn = document.getElementById('submit-another-btn');
    if (submitAnotherBtn) submitAnotherBtn.addEventListener('click', () => location.reload());

    const editBtn = document.getElementById('edit-btn');
    if (editBtn) editBtn.addEventListener('click', showFormAgain);

    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this case? This action cannot be undone.')) return;
            try {
                const response = await fetch(`../api/delete_case.php?id=${caseId}`);
                const data = await response.json();
                if (response.ok && data.success) {
                    alert('Case deleted');
                    form.reset();
                    caseId = null;
                    hasSubmitted = false;
                    const sb = document.getElementById('submit-btn');
                    if (sb) sb.innerHTML = 'Submit Case';
                    showFormAgain();
                } else {
                    alert(data.error || 'Delete failed');
                }
            } catch (err) {
                alert('Delete error');
            }
        });
    }

    // Toggle treatment / medication fields (do not mass-toggle required attributes)
    document.querySelectorAll('input[name="CASE_TYPE"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'treatment') {
                treatmentFields.classList.remove('hidden');
                medicationFields.classList.add('hidden');
            } else {
                treatmentFields.classList.add('hidden');
                medicationFields.classList.remove('hidden');
            }
            updateRequiredFields();
        });
    });

    // Update required state for hospital name and durations based on prescription/hospitalization
    function updateRequiredFields() {
        const hasPrescriptionEl = document.getElementById('hasPrescription');
        const requiresHospitalEl = document.getElementById('requiresHospitalization');
        const hospitalName = document.getElementById('hospitalName');
        const medDuration = document.getElementById('duration');
        const estDuration = document.getElementById('estimatedDuration');

        const hasPrescription = hasPrescriptionEl && hasPrescriptionEl.value === '1';
        const requiresHospital = requiresHospitalEl && requiresHospitalEl.value === '1';
        const required = hasPrescription || requiresHospital;

        const caseType = document.querySelector('input[name="CASE_TYPE"]:checked')?.value || null;

        // Only set required on fields relevant to the currently visible case type
        if (caseType === 'treatment') {
            if (estDuration) estDuration.required = required;
            if (medDuration) medDuration.required = false;
            if (hospitalName) hospitalName.required = false;
        } else if (caseType === 'medication') {
            if (medDuration) medDuration.required = required;
            if (hospitalName) hospitalName.required = required;
            if (estDuration) estDuration.required = false;
        } else {
            // Default: clear specific requirements
            if (hospitalName) hospitalName.required = false;
            if (medDuration) medDuration.required = false;
            if (estDuration) estDuration.required = false;
        }
    }

    // Bind change listeners to prescription/hospitalization selects
    const hasPrescriptionEl = document.getElementById('hasPrescription');
    const requiresHospitalEl = document.getElementById('requiresHospitalization');
    if (hasPrescriptionEl) hasPrescriptionEl.addEventListener('change', updateRequiredFields);
    if (requiresHospitalEl) requiresHospitalEl.addEventListener('change', updateRequiredFields);

    // Run initial update once
    updateRequiredFields();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Submitting...';

        try {
            const formData = new FormData(form);
            if (caseId) formData.append('editCaseId', caseId);

            const response = await fetch('../api/submit_case.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                caseId = data.case_id;
                hasSubmitted = true;
                submitBtn.innerHTML = 'Update Case';
                const caseTitle = (document.getElementById('caseTitle') && document.getElementById('caseTitle').value.trim()) || 'Your case';
                showSuccessScreen(caseTitle);
            } else {
                alert(data.error || 'Submission failed');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred.');
        } finally {
            submitBtn.disabled = false;
        }
    });
});
