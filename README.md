# QRGlow - Premium QR Code Suite

A premium, modern client-side web application for generating and scanning static, permanent QR Codes. Built with vanilla HTML5, CSS3, and JavaScript, styled with glassmorphism and neon glows.

## Features
- **Permanent QR Code Generation:** Instantly generate QR codes for URLs, Plain Text, Wi-Fi details, Emails, Phones, and SMS.
- **Custom Design Picker:** Change QR code color and background color dynamically with real-time resizing and margins.
- **Camera Scanning:** Scan QR codes directly using your device's camera (webcam).
- **Image Scanning:** Drag and drop or select an image file to decode a QR code.
- **Local Activity History:** Local history log to keep track of your scans and generations, saved in browser storage.
- **Modern UI/UX:** Built-in toast notifications, sound feedback (beeps) on scan, and a stunning dark mode interface.

---

## How to Host on GitHub Pages (Free)

To share this app so anyone else in the world can use it to generate their own permanent QR codes, follow these simple steps:

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com).
2. Create a new repository (e.g., named `qr-glow`). Keep it **Public**.
3. Do not initialize with a README, `.gitignore`, or license.

### Step 2: Push your local code to GitHub
Run the following commands in your terminal/command line inside the `qr-code` project directory:

```bash
# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit of QRGlow suite"

# Rename branch to main
git branch -M main

# Add your repository URL (replace USERNAME and REPO-NAME)
git remote add origin https://github.com/USERNAME/REPO-NAME.git

# Push code to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.com.
2. Click on the **Settings** tab (the gear icon).
3. In the left-hand sidebar, click on **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** -> **Branch**:
   - Change "None" to **`main`**.
   - Ensure the folder is set to **`/(root)`**.
5. Click **Save**.
6. Wait 1-2 minutes, then refresh the page. You will see a banner at the top of the Pages settings showing your live URL (e.g., `https://username.github.io/repo-name/`).

Anyone visiting that link will be able to generate and scan their own QR codes!
