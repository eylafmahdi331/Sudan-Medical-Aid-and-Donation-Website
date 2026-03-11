document.addEventListener('DOMContentLoaded', async () => {
    // Determine context (Root vs Pages)
    const isInPages = window.location.pathname.includes('/pages/');
    const apiPath = isInPages ? '../api/' : './api/';
    const pagesPath = isInPages ? './' : './pages/';
    const rootPath = isInPages ? '../' : './';

    try {
        const response = await fetch(apiPath + 'check_auth.php');
        const data = await response.json();

        // Desktop Nav Actions Container
        const allDesktopContainers = document.querySelectorAll('.hidden.lg\\:flex');
        let desktopActions = null;

        allDesktopContainers.forEach(container => {
            if (container.querySelector('a[href*="dashboard"]') || container.querySelector('a[href*="submit-case"]')) {
                desktopActions = container;
            }
        });

        // Mobile Menu
        const mobileMenu = document.getElementById('mobile-menu');

        if (data.authenticated) {
            const user = data.user;

            // Desktop Nav
            if (desktopActions) {
                // Admin Button
                if (user.role === 'admin') {
                    const adminBtn = document.createElement('a');
                    adminBtn.href = pagesPath + 'admin_providers.html';
                    adminBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-9 px-4 bg-purple-600 text-white hover:bg-purple-700';
                    adminBtn.innerHTML = '<i data-lucide="shield" class="w-4 h-4"></i> Admin';
                    adminBtn.style.backgroundColor = '#9333ea';
                    adminBtn.style.color = 'white';
                    desktopActions.insertBefore(adminBtn, desktopActions.firstChild);
                }

                // Logout Button
                const logoutBtn = document.createElement('a');
                logoutBtn.href = apiPath + 'logout.php';
                logoutBtn.className = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold h-9 px-4 hover:bg-muted';
                logoutBtn.innerHTML = '<i data-lucide="log-out" class="w-4 h-4"></i> Logout';
                logoutBtn.style.color = '#ef4444';
                desktopActions.appendChild(logoutBtn);

                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            // Mobile menu update
            if (mobileMenu) {
                const container = mobileMenu.querySelector('.flex.flex-col.gap-2');
                if (container) {
                    if (user.role === 'admin') {
                        const mobileAdmin = document.createElement('a');
                        mobileAdmin.href = pagesPath + 'admin_providers.html';
                        mobileAdmin.className = 'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors';
                        mobileAdmin.innerHTML = '<i data-lucide="shield" class="w-4 h-4"></i> Admin Panel';
                        mobileAdmin.style.backgroundColor = '#9333ea';
                        mobileAdmin.style.color = 'white';
                        container.appendChild(mobileAdmin);
                    }

                    const mobileLogout = document.createElement('a');
                    mobileLogout.href = apiPath + 'logout.php';
                    mobileLogout.className = 'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-muted';
                    mobileLogout.innerHTML = '<i data-lucide="log-out" class="w-4 h-4"></i> Logout';
                    mobileLogout.style.color = '#ef4444';
                    container.appendChild(mobileLogout);

                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }

        } else {
            // Not logged in - Update Dashboard links to Login
            const dashboardBtns = document.querySelectorAll('a[href*="dashboard"]');
            dashboardBtns.forEach(btn => {
                if (!window.location.href.includes('dashboard')) {
                    btn.href = pagesPath + 'auth.html';
                    if (btn.textContent.trim().includes('Dashboard')) {
                        btn.innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i> Login';
                    }
                }
            });

            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

    } catch (error) {
        console.error('Auth check failed:', error);
    }
});
