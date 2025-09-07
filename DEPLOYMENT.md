# Deployment Guide for speedto24.com

## Quick Deploy to Netlify

### Method 1: Drag & Drop (Easiest)
1. Go to [netlify.com](https://netlify.com) and sign up/log in
2. Drag your entire project folder to the deploy area
3. Your site will be live immediately with a random URL
4. Go to Site Settings → Domain Management → Add Custom Domain
5. Enter `speedto24.com` and follow DNS setup instructions

### Method 2: Git Integration (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Netlify
3. Deploy automatically on every push

## Custom Domain Setup

### DNS Configuration
Add these DNS records to your domain registrar:

**For speedto24.com:**
- Type: A
- Name: @
- Value: 75.2.60.5

**For www.speedto24.com:**
- Type: CNAME  
- Name: www
- Value: speedto24.netlify.app

### Netlify Domain Settings
1. Go to Site Settings → Domain Management
2. Add `speedto24.com` as primary domain
3. Add `www.speedto24.com` as alias
4. Enable "Force HTTPS"
5. Enable "Redirect www to non-www" (optional)

## Performance Optimizations
- ✅ Static assets cached for 1 year
- ✅ HTML files have no-cache for updates
- ✅ Security headers configured
- ✅ Mobile-optimized responsive design

## Features Included
- 🎮 Daily Challenge (5 puzzles per day)
- 🎯 Practice Mode (unlimited puzzles)
- ⏱️ Timer with penalty system
- 📱 Mobile-responsive design
- ⌨️ Keyboard shortcuts
- 🎨 Modern UI with animations

Your site will be live at: https://speedto24.com
