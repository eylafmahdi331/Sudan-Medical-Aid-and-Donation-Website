document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const authForm = document.getElementById('auth-form');
    const nameFields = document.getElementById('name-fields');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    const btnText = document.getElementById('btn-text');
    const footerText = document.getElementById('footer-text');
    const toggleAuthBtn = document.getElementById('toggle-auth-btn');
    const submitBtn = document.getElementById('submit-btn');

    let isLogin = true;

    function toggleMode() {
        isLogin = !isLogin;

        if (isLogin) {
            // Switch to Login
            nameFields.classList.add('hidden');
            document.getElementById('firstName').removeAttribute('required');
            document.getElementById('lastName').removeAttribute('required');
            document.getElementById('forgot-password').classList.remove('hidden');

            tabLogin.classList.remove('text-muted-foreground', 'hover:text-foreground');
            tabLogin.classList.add('bg-card', 'text-foreground', 'shadow-sm');

            tabSignup.classList.add('text-muted-foreground', 'hover:text-foreground');
            tabSignup.classList.remove('bg-card', 'text-foreground', 'shadow-sm');

            pageTitle.textContent = 'Welcome Back';
            pageSubtitle.textContent = 'Sign in to track your donations and cases';
            btnText.textContent = 'Sign In';
            footerText.textContent = "Don't have an account? ";
            toggleAuthBtn.textContent = 'Sign up';
        } else {
            // Switch to Signup
            nameFields.classList.remove('hidden');
            document.getElementById('firstName').setAttribute('required', 'true');
            document.getElementById('lastName').setAttribute('required', 'true');
            document.getElementById('forgot-password').classList.add('hidden');

            tabSignup.classList.remove('text-muted-foreground', 'hover:text-foreground');
            tabSignup.classList.add('bg-card', 'text-foreground', 'shadow-sm');

            tabLogin.classList.add('text-muted-foreground', 'hover:text-foreground');
            tabLogin.classList.remove('bg-card', 'text-foreground', 'shadow-sm');

            pageTitle.textContent = 'Create Account';
            pageSubtitle.textContent = 'Join to start making a difference';
            btnText.textContent = 'Create Account';
            footerText.textContent = "Already have an account? ";
            toggleAuthBtn.textContent = 'Sign in';
        }
    }

    tabLogin.addEventListener('click', () => {
        if (!isLogin) toggleMode();
    });

    tabSignup.addEventListener('click', () => {
        if (isLogin) toggleMode();
    });

    toggleAuthBtn.addEventListener('click', toggleMode);

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        // API Endpoint depends on mode
        const endpoint = isLogin ? '../api/login.php' : '../api/register.php';

        if (!isLogin) {
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
        }

        // Loading State
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Processing...';
        lucide.createIcons();

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                window.location.href = 'dashboard.html';
            } else {
                alert(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login Error:', error);
            alert('An error occurred. check console for details.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
            lucide.createIcons();
        }
    });
});
