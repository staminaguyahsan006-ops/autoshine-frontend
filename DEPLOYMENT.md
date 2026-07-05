# 🚀 AutoShine Full Deployment Guide

Complete step-by-step guide to set up, test locally, and deploy the AutoShine car detailing website on the internet.

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 1: LOCAL TESTING (Before deploying)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### STEP 1: Install Required Software

Download and install the following:

| Software | Download Link | Purpose |
|----------|---------------|---------|
| Node.js | [nodejs.org](https://nodejs.org) | Run JavaScript backend |
| Git | [git-scm.com](https://git-scm.com) | Version control |
| VS Code | [code.visualstudio.com](https://code.visualstudio.com) | Code editor |

Verify installations in your terminal:

```bash
node --version
npm --version
git --version
```

---

### STEP 2: Set Up MongoDB Atlas (Free Database)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Click **"Try Free"** and create an account
3. Choose **FREE tier (M0 Sandbox)**
4. Select cloud provider: **AWS**
5. Select region closest to you
6. Click **"Create Cluster"** (takes 2-3 minutes)

**Security setup:**

7. Create database user:
   - Username: `autoshineAdmin`
   - Password: create a strong password
   - Click **"Create User"**

8. Network access:
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"**
   - Confirm

**Get connection string:**

9. Click **"Connect"**
10. Choose **"Connect your application"**
11. Copy the connection string
12. Replace `<password>` with your actual password
13. Replace `myFirstDatabase` with: `autoshine`

Final format:
```
mongodb+srv://autoshineAdmin:YOURPASSWORD@cluster0.xxxxx.mongodb.net/autoshine
```

---

### STEP 3: Set Up Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **"Security"** in the left sidebar
3. Enable **"2-Step Verification"** if not already on
4. Go back to Security
5. Scroll to **"2-Step Verification"**
6. Scroll to bottom: **"App passwords"**
7. Click **"App passwords"**
8. Select app: **"Mail"**
9. Select device: **"Other"** → type **"AutoShine"**
10. Click **"Generate"**
11. Copy the 16-character password shown
12. This is your `EMAIL_PASS` value

---

### STEP 4: Configure .env File

1. Go to the `backend` folder
2. Copy `.env.example` to `.env`:

```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

3. Open `.env` in VS Code
4. Fill in every value:

```env
PORT=5000
MONGO_URI=mongodb+srv://autoshineAdmin:YOURPASSWORD@cluster0.xxxxx.mongodb.net/autoshine
JWT_SECRET=any-long-random-string-min-32-chars
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-char-app-password
WHATSAPP_NUMBER=923001234567
FRONTEND_URL=http://localhost:5500
```

5. Save the file
6. **NEVER** share this file or push it to GitHub

---

### STEP 5: Install Backend Dependencies

```bash
cd backend
npm install
```

Should see: `added X packages`

---

### STEP 6: Start Backend Server

```bash
npm run dev
```

You should see:
```
🚗 AutoShine Server running on port 5000
📡 API ready at http://localhost:5000
✅ MongoDB Connected Successfully
```

---

### STEP 7: Test Backend is Working

Open your browser and go to:
[http://localhost:5000](http://localhost:5000)

Should see JSON:
```json
{
  "message": "AutoShine API is running",
  "version": "1.0.0",
  "status": "healthy"
}
```

---

### STEP 8: Open Frontend

1. Open VS Code
2. Install **"Live Server"** extension
3. Right-click on `index.html`
4. Click **"Open with Live Server"**
5. Website opens at: [http://127.0.0.1:5500](http://127.0.0.1:5500)

---

### STEP 9: Test Full Booking Flow

1. Go to the booking page
2. Fill in all fields with test data
3. Click **"Confirm Booking"**
4. Should see a success message
5. Check your email for confirmation
6. Go to `admin/login.html`
7. Login with your admin credentials
8. Should see the booking in the dashboard
9. Try changing status to **Confirmed**
10. Customer should receive a confirmation email

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 2: DEPLOY BACKEND (Railway.app)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### STEP 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and login
2. Click **"New repository"**
3. Name it: `autoshine-backend`
4. Set to **Private** (recommended)
5. Click **"Create repository"**

In your backend folder, run:

```bash
git init
git add .
git commit -m "Initial backend setup"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/autoshine-backend
git push -u origin main
```

> **IMPORTANT:** Make sure `.env` is in `.gitignore`!

Create a `.gitignore` file with:
```
node_modules/
.env
*.log
```

---

### STEP 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → Login with GitHub
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**
5. Select `autoshine-backend`
6. Railway auto-detects Node.js
7. Click **"Deploy Now"**
8. Wait for deployment (2-3 minutes)

---

### STEP 3: Add Environment Variables on Railway

1. Click on your deployed service
2. Click **"Variables"** tab
3. Click **"Add Variable"** for each:

Add all variables from your `.env` file:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `EMAIL_USER`
- `EMAIL_PASS`
- `WHATSAPP_NUMBER`
- `FRONTEND_URL`

4. Railway auto-restarts with new variables

---

### STEP 4: Get Your Backend URL

1. Click **"Settings"** tab
2. Click **"Generate Domain"**
3. Copy your URL:
   ```
   https://autoshine-backend.up.railway.app
   ```
4. Test it: open in browser
   Should see: `AutoShine API is running`
5. **SAVE THIS URL** — you need it for the frontend

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 3: DEPLOY FRONTEND (Netlify)
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### STEP 1: Update API URLs in Frontend

Before deploying the frontend, update all `fetch()` calls from `localhost` to your Railway URL.

Find and replace in ALL frontend HTML files:
```
FIND:    http://localhost:5000
REPLACE: https://your-railway-url.up.railway.app
```

Files to update:
- `frontend/booking.html`
- `frontend/contact.html`
- `frontend/admin/login.html`
- `frontend/admin/dashboard.html`

---

### STEP 2: Update CORS in Backend

In `backend/server.js`, update the CORS origin array:

```javascript
origin: [
  'http://localhost:5500',
  'https://YOURSITE.netlify.app',
  'https://YOURCUSTOMDOMAIN.com'
]
```

Push the update to GitHub (Railway auto-redeploys):
```bash
git add .
git commit -m "Update CORS for production"
git push
```

---

### STEP 3: Deploy to Netlify

#### METHOD A — Drag and Drop (Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Login or create a free account
3. Click **"Add new site"**
4. Click **"Deploy manually"**
5. Drag your entire `frontend` folder into the deploy box
6. Wait 30 seconds
7. Site is live at a random URL:
   ```
   https://amazing-site-123.netlify.app
   ```

#### METHOD B — GitHub (Better for updates)

1. Push the frontend folder to GitHub:
   - Create new repo: `autoshine-frontend`
   - Push frontend files to it

2. On Netlify: Click **"Add new site"**
3. Click **"Import from Git"**
4. Connect GitHub
5. Select `autoshine-frontend` repo
6. Build settings: leave blank (no build needed)
7. Click **"Deploy site"**
8. Auto-deploys every time you push to GitHub

---

### STEP 4: Get Your Netlify URL

Copy your site URL:
```
https://autoshine.netlify.app
```

- Test all pages work correctly
- Test the booking form submits successfully

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 4: CUSTOM DOMAIN NAME
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### STEP 1: Buy Your Domain

1. Go to [namecheap.com](https://namecheap.com) (recommended)
   - OR [godaddy.com](https://godaddy.com)
   - OR [porkbun.com](https://porkbun.com)
2. Search for your domain:
   - `autoshine.com` OR
   - `autoshinepk.com` OR
   - `autoshinedetailing.com`
3. Add to cart (around $10-15/year for `.com`)
4. Complete purchase

---

### STEP 2: Connect Domain to Netlify

1. In Netlify: go to your site
2. Click **"Domain settings"**
3. Click **"Add custom domain"**
4. Type your domain: `autoshine.com`
5. Click **"Verify"**
6. Netlify shows you DNS records to add

---

### STEP 3: Update DNS on Namecheap

1. Go to [namecheap.com](https://namecheap.com) → login
2. Go to **"Domain List"**
3. Click **"Manage"** next to your domain
4. Click **"Advanced DNS"**
5. Delete existing A and CNAME records
6. Add records from Netlify:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `75.2.60.5` | Automatic |
| CNAME | `www` | `your-site.netlify.app` | Automatic |

7. Click the checkmark to save each record

---

### STEP 4: Enable HTTPS (Free SSL)

1. Back in Netlify domain settings
2. Scroll to **"HTTPS"**
3. Click **"Verify DNS configuration"**
4. Click **"Provision certificate"**
5. Wait 10-30 minutes
6. Your site is now live at:
   ```
   https://autoshine.com
   ```
   with a green padlock 🔒

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 5: HOW TO UPDATE YOUR WEBSITE
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### METHOD A — Update via GitHub (Recommended)

1. Make changes to your files in VS Code
2. Save files
3. Open terminal in project folder
4. Run these commands:

```bash
git add .
git commit -m "describe what you changed"
git push
```

5. Netlify auto-detects the push
6. Rebuilds and deploys in 30 seconds
7. Changes are live automatically

---

### METHOD B — Update via Netlify Drag & Drop

1. Make changes to your files
2. Go to [netlify.com](https://netlify.com) → your site
3. Click **"Deploys"** tab
4. Drag updated frontend folder to deploy box
5. Live in 30 seconds

---

### Updating Backend

1. Make changes to backend files
2. Commit and push:

```bash
git add . && git commit -m "update"
git push
```

3. Railway auto-redeploys in 1-2 minutes

---

### Updating Prices or Business Info

All prices and text are in the HTML files.

- Find text using VS Code search (`Ctrl + F`)
- Change the text, save, push to GitHub

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 6: POST-LAUNCH CHECKLIST
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before announcing your website, check everything:

### FRONTEND
- [ ] All pages load correctly
- [ ] All navigation links work
- [ ] Booking form submits successfully
- [ ] Success message shows after booking
- [ ] Contact form works
- [ ] WhatsApp button opens correctly
- [ ] Social media links work
- [ ] Website looks good on mobile phone
- [ ] Website looks good on tablet
- [ ] All images and fonts load
- [ ] No broken links anywhere

### BACKEND
- [ ] Booking saves to MongoDB Atlas
- [ ] Customer receives confirmation email
- [ ] You receive notification email
- [ ] Admin login works
- [ ] Dashboard shows bookings
- [ ] Status updates work
- [ ] Delete booking works
- [ ] Contact messages appear in dashboard

### DOMAIN
- [ ] Domain loads your website
- [ ] www.yourdomain.com works
- [ ] HTTPS padlock is green
- [ ] No security warnings

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 7: IMPORTANT SECURITY REMINDERS
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1. NEVER push .env to GitHub

Add `.env` to `.gitignore` immediately:

```gitignore
node_modules/
.env
*.log
```

### 2. Change default admin password

Use a strong password:
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Example: `Auto$hine2024!`

### 3. Change JWT_SECRET

Use a random 64+ character string. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. MongoDB Atlas Security

- Create a specific database user
- Do NOT use root credentials
- Restrict IP access if possible (instead of "Allow from Anywhere")

### 5. Keep dependencies updated

Run monthly:
```bash
npm audit
npm audit fix
```

### 6. Backup your database monthly

MongoDB Atlas has free backup tools — enable them in your cluster settings.

---

## 🎉 You're Live!

Your AutoShine website is now deployed and ready for customers. Share your domain and start taking bookings!
