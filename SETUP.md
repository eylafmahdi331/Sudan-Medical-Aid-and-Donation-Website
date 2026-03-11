# Sudan Medical Aid Platform - Setup Guide

This guide will help you set up the Sudan Medical Aid Platform on a new computer.

## 📋 Requirements

Before you begin, make sure you have:

| Software | Version | Download |
|----------|---------|----------|
| XAMPP | 7.4+ or 8.0+ | [Download XAMPP](https://www.apachefriends.org/download.html) |
| Node.js | 16+ (optional) | [Download Node.js](https://nodejs.org/) |
| Web Browser | Chrome/Firefox | Any modern browser |

## 🚀 Step-by-Step Installation

### Step 1: Install XAMPP

1. Download XAMPP from [apachefriends.org](https://www.apachefriends.org/download.html)
2. Run the installer
3. Install to default location: `C:\xampp`
4. Select components: **Apache**, **MySQL**, **PHP**
5. Complete the installation

### Step 2: Copy Project Files

1. Copy the entire `sudan-medical-aid` folder
2. Paste it to: `C:\xampp\htdocs\sudan-medical-aid`

Your folder structure should look like:
```
C:\xampp\htdocs\sudan-medical-aid\
├── index.html
├── *.html
├── *.php
├── *.js
├── styles.css
├── assets/
└── ...
```

### Step 3: Start XAMPP Services

1. Open **XAMPP Control Panel** (search for "XAMPP" in Start menu)
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**
4. Both should show green "Running" status

![XAMPP Control Panel](./assets/xampp-panel.png)

### Step 4: Set Up the Database

1. Open your web browser
2. Go to: **http://localhost/sudan-medical-aid/api/setup_db.php**
3. You should see: "Database setup completed successfully!"
4. This creates all the required database tables

### Step 5: Create Admin User

1. Go to: **http://localhost/sudan-medical-aid/api/create_admin.php**
2. This creates an admin account with:
   - **Email**: `admin@sudanaid.org`
   - **Password**: `admin123`

### Step 6: Open the Website

1. Go to: **http://localhost/sudan-medical-aid/**
2. The homepage should load with full styling
3. Try logging in (will redirect to `pages/auth.html`)

---

## 🔧 Troubleshooting

### Problem: "This site can't be reached"
**Solution**: 
- Make sure Apache is running in XAMPP
- Check if the URL is correct: `http://localhost/sudan-medical-aid/`

### Problem: "Database error"
**Solution**:
- Make sure MySQL is running in XAMPP
- Run `setup_db.php` again
- Check if the database `SRCS` exists in phpMyAdmin (`http://localhost/phpmyadmin`)

### Problem: Styles not loading (page looks plain)
**Solution**:
1. Press `Ctrl + Shift + R` to hard refresh
2. Clear browser cache: `Ctrl + Shift + Delete`
3. Make sure `styles.css` exists in the project folder

### Problem: "Failed to open stream" PHP error
**Solution**:
- Check file permissions
- Make sure all PHP files are in the correct folder

### Problem: Login doesn't work
**Solution**:
1. Go to: `http://localhost/sudan-medical-aid/debug_login.php`
2. This will show you what's wrong
3. Usually need to run `setup_db.php` and `create_admin.php`

---

## 📱 Accessing from Other Devices (Same Network)

To access the site from a phone or another computer on the same network:

1. Find your computer's IP address:
   - Open Command Prompt
   - Type: `ipconfig`
   - Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. On the other device, open browser and go to:
   ```
   http://192.168.1.100/sudan-medical-aid/
   ```
   (Replace with your actual IP)

---

## 🔄 Rebuilding Styles (Optional)

If you need to modify the Tailwind CSS:

1. Install Node.js dependencies:
   ```bash
   cd C:\xampp\htdocs\sudan-medical-aid
   npm install
   ```

2. Rebuild styles:
   ```bash
   npm run build
   ```

3. For auto-rebuild during development:
   ```bash
   npm run watch
   ```

---

## 👤 User Accounts

### Default Admin
- **Email**: `admin@sudanaid.org`
- **Password**: `admin123`
- **Access**: Admin panel, provider verification

### Create New Users
- Go to: `http://localhost/sudan-medical-aid/auth.html`
- Click "Sign Up"
- Fill in the registration form

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `setup_db.php` | Creates database and tables |
| `create_admin.php` | Creates admin user |
| `db.php` | Database connection settings |
| `debug_login.php` | Diagnose login issues |

---

## ⚙️ Database Configuration

If you need to change database settings, edit `db.php`:

```php
$host = 'localhost';    // Database host
$db   = 'SRCS';         // Database name
$user = 'root';         // Database username
$pass = '';             // Database password (empty for XAMPP default)
```

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Run `debug_login.php` to diagnose issues
3. Check XAMPP Control Panel for error logs
4. Make sure all files are copied correctly

---

## ✅ Quick Checklist

- [ ] XAMPP installed
- [ ] Project copied to `C:\xampp\htdocs\sudan-medical-aid`
- [ ] Apache started (green in XAMPP)
- [ ] MySQL started (green in XAMPP)
- [ ] `setup_db.php` run successfully
- [ ] `create_admin.php` run successfully
- [ ] Website loads at `http://localhost/sudan-medical-aid/`
- [ ] Login works with admin credentials
