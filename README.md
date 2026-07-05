# 🚗 AutoShine — Premium Mobile Car Detailing Website

Full-stack website for AutoShine mobile car detailing business. Built with HTML/CSS/JS frontend and Node.js/Express/MongoDB backend.

---

## Features

- 6 public pages (Home, Services, Pricing, About, Contact, Booking)
- Online appointment booking system
- Admin dashboard with JWT authentication
- MongoDB database for storing bookings
- Email confirmations via Nodemailer
- Contact form with auto-reply
- Mobile responsive design
- Security middleware and rate limiting
- CSV export of appointments
- Status tracking for bookings

---

## Tech Stack

| Category   | Technology          |
|------------|---------------------|
| Frontend   | HTML5, CSS3, JS     |
| Backend    | Node.js + Express   |
| Database   | MongoDB + Mongoose  |
| Auth       | JWT                 |
| Email      | Nodemailer + Gmail  |
| Deployment | Netlify + Railway   |

---

## Project Structure

```
autoshine-website/
├── frontend/
│   ├── index.html
│   ├── services.html
│   ├── pricing.html
│   ├── booking.html
│   ├── about.html
│   ├── contact.html
│   └── admin/
│       ├── login.html
│       └── dashboard.html
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── models/
    │   ├── Appointment.js
    │   └── ContactMessage.js
    ├── routes/
    │   ├── appointments.js
    │   ├── contact.js
    │   └── admin.js
    └── middleware/
        ├── auth.js
        ├── errorHandler.js
        ├── rateLimiter.js
        └── validator.js
```

---

## Quick Start (Local Setup)

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOURUSERNAME/autoshine-website.git
   cd autoshine-website
   ```

2. **Set up the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in your .env values
   npm install
   npm run dev
   ```

3. **Open the frontend**
   - Install the "Live Server" VS Code extension
   - Right-click `index.html` → "Open with Live Server"
   - Or open `index.html` directly in your browser

4. **Access the admin dashboard**
   - Navigate to `admin/login.html`
   - Login with credentials from your `.env` file

---

## Environment Variables

| Variable         | Description                              | Example                                    |
|------------------|------------------------------------------|--------------------------------------------|
| PORT             | Server port                              | 5000                                       |
| MONGO_URI        | MongoDB connection string                | mongodb+srv://...                          |
| JWT_SECRET       | Secret key for signing JWT tokens        | super-secret-random-string                 |
| JWT_EXPIRES_IN   | JWT token expiry time                    | 7d                                         |
| ADMIN_USERNAME   | Admin login username                     | admin                                      |
| ADMIN_PASSWORD   | Admin login password                     | strong-password                            |
| EMAIL_USER       | Gmail address for sending emails         | youremail@gmail.com                        |
| EMAIL_PASS       | Gmail app password (16 characters)       | abcd efgh ijkl mnop                        |
| WHATSAPP_NUMBER  | Business WhatsApp with country code      | 923001234567                               |
| FRONTEND_URL     | URL of your frontend (for CORS)          | http://localhost:5500                      |

---

## API Endpoints

| Method | Endpoint                      | Auth | Description              |
|--------|-------------------------------|------|--------------------------|
| POST   | /api/appointments             | No   | Submit new booking       |
| GET    | /api/appointments             | Yes  | Get all bookings         |
| GET    | /api/appointments/stats       | Yes  | Get booking stats        |
| GET    | /api/appointments/export      | Yes  | Export CSV               |
| GET    | /api/appointments/:id         | Yes  | Get single booking       |
| PUT    | /api/appointments/:id         | Yes  | Update booking status    |
| DELETE | /api/appointments/:id         | Yes  | Delete booking           |
| POST   | /api/contact                  | No   | Submit contact form      |
| GET    | /api/contact                  | Yes  | Get all messages         |
| GET    | /api/contact/stats            | Yes  | Get message stats        |
| PUT    | /api/contact/:id              | Yes  | Update message           |
| DELETE | /api/contact/:id              | Yes  | Delete message           |
| POST   | /api/admin/login              | No   | Admin login              |
| POST   | /api/admin/logout             | Yes  | Admin logout             |
| GET    | /api/admin/verify             | Yes  | Verify token             |
| GET    | /api/admin/dashboard          | Yes  | Dashboard stats          |

---

## Admin Portal Access

1. Navigate to `/admin/login.html` on your website
2. Enter your admin credentials (set in `.env`)
3. Upon successful login, you will receive a JWT token stored in `localStorage`
4. The dashboard will load with:
   - Total bookings count
   - Pending, confirmed, completed, cancelled stats
   - Recent bookings list
   - Unread contact messages
   - Revenue overview
5. Use the dashboard to:
   - View all bookings
   - Update booking status (Pending → Confirmed → Completed)
   - Delete bookings
   - View and manage contact messages
   - Export bookings to CSV

---

## Customization Guide

### Update Business Info
Edit the following in your HTML files:
- Business name: Search for "AutoShine" in all HTML files
- Phone number: Update in `.env` and HTML footers
- Address: Edit in `about.html` and `contact.html`
- Social media links: Edit in footer sections

### Update Colors
The primary color scheme uses gold (`#d4af37`). To change:
- Search for `#d4af37` across all HTML and CSS files
- Replace with your preferred hex color

### Update Prices
Prices are defined in:
- Frontend: `pricing.html` (display prices)
- Backend: `models/Appointment.js` (estimated price matrix in pre-save hook)

Update both locations to keep them in sync.
