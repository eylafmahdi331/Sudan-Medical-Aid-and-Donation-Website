# Sudan Medical Aid Platform

A comprehensive web-based platform for the Sudanese Red Crescent Society(School Project) to manage medical aid, campaigns, connect patients with donors, and coordinate with medical providers.

![Platform Preview](./assets/preview.png)

## 🌟 Features

### For Donors
- **Browse Medical Cases** - Contribute and View verified patient cases needing support
- **Support Campaigns** - Contribute to large-scale medical relief campaigns
- **Track Donations** - Personal dashboard to monitor donation history
- **Direct Impact** - See exactly where your donations go

### For Patients/Submitters
- **Submit Cases** - Request medical aid for treatment or medication
- **Upload Documents** - Attach medical records and prescriptions
- **Track Progress** - Monitor case status and funding progress
- **Track Cases** - Personal dashboard to monitor medical cases submited

### For Medical Providers
- **Register as provider partner** - Hospitals and pharmacies can join the network
- **Offer Services** - Provide discounted or donated medical services
- **Get Verified** - Admin verification ensures trust

### For Organization
- **Submit Campaigns** - Registered partners who can create campaigns and events
- **Track Progress** - Monitor campaigna status and funding progress

### For Administrators
- **Verify Providers** - Review and approve provider applications
- **Manage Cases** - Oversee submitted medical cases
- **View Statistics** - Dashboard with platform metrics

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Styling | Tailwind CSS |
| Icons | Lucide Icons |
| Backend | PHP 7.4+ |
| Database | MySQL 5.7+ / MariaDB |
| Server | Apache (XAMPP) |

## 📁 Project Structure

```
sudan-medical-aid/
├── index.html              # Home page
├── README.md               # Documentation
├── SETUP.md                # Setup guide
│
├── pages/                  # HTML Pages
│   ├── auth.html
│   ├── dashboard.html
│   ├── cases.html
│   ├── ...
│
├── js/                     # JavaScript files
│   ├── nav-auth.js
│   ├── ...
│
├── css/                    # Stylesheets
│   ├── styles.css
│   └── input.css
│
├── api/                    # PHP Backend
│   ├── login.php
│   ├── db.php
│   ├── setup_db.php
│   ├── ...
│
├── assets/                 # Images and media
└── uploads/                # User uploads
```

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed installation instructions.

### Prerequisites
- XAMPP (Apache + MySQL + PHP)
- Node.js (for Tailwind CSS)
- Web browser

### Basic Steps
1. Install XAMPP
2. Clone/copy project to `C:\xampp\htdocs\sudan-medical-aid`
3. Start Apache and MySQL
4. Run `setup_db.php` to create database
5. Run `create_admin.php` to create admin user
6. Open `http://localhost/sudan-medical-aid`

## 👤 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sudanaid.org | admin123 |

## 📡 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login.php` | POST | User login |
| `/api/register.php` | POST | User registration |
| `/api/logout.php` | GET | User logout |
| `/api/check_auth.php` | GET | Check auth status |

### Cases
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/get_cases.php` | GET | List medical cases |
| `/api/submit_case.php` | POST | Submit new case |

### Campaigns
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/get_campaigns.php` | GET | List campaigns |
| `/create_campaign.php` | POST | Create new campaign |

### Providers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/get_providers.php` | GET | List approved providers |
| `/register_provider.php` | POST | Register new provider |
| `/get_pending_providers.php` | GET | List pending (admin) |
| `/verify_provider.php` | POST | Approve/reject (admin) |

### Donations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/process_donation.php` | POST | Process donation |
| `/dashboard.php` | GET | Get user dashboard data |

## 🗄️ Database Schema

The platform uses the following main tables:

- **USER** - User accounts (donors, patients, admins)
- **PATIENT** - Patient information
- **MEDICAL_CASE**(supertype) - Medical aid requests
- **TREATMENT** - Treatment case details
- **MEDICATION** - Medication case details
- **CAMPAIGN** - Fundraising campaigns
- **DONATION** (supertype) - Donation records
- **MEDICAL_PROVIDER** - Partner hospitals/pharmacies
- **MEDICAL_FILE** - Uploaded documents

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:
```javascript
primary: '#c41e3a',      // Main brand color (crimson)
secondary: '#f5f5f5',    // Light backgrounds
```

### Rebuild Styles
After changing Tailwind config:
```bash
npm run build
```

## 📝 License

This project is developed for the Sudanese Red Crescent Society (stimulation for a school project).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request


