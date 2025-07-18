#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Hairdresser Scheduler - Puppeteer Solution Setup');
console.log('===================================================');
console.log('');

async function setupPuppeteerSolution() {
    try {
        // Step 1: Check Node.js version
        console.log('📋 Step 1: Checking Node.js version...');
        const nodeVersion = process.version;
        console.log(`✅ Node.js version: ${nodeVersion}`);
        
        if (parseInt(nodeVersion.slice(1)) < 14) {
            console.log('⚠️ Warning: Node.js 14+ recommended');
        }
        console.log('');
        
        // Step 2: Install Puppeteer
        console.log('📦 Step 2: Installing Puppeteer...');
        console.log('This may take 2-3 minutes to download Chromium...');
        
        try {
            execSync('npm install puppeteer', { stdio: 'inherit' });
            console.log('✅ Puppeteer installed successfully');
        } catch (error) {
            console.log('⚠️ npm install failed, trying alternative method...');
            execSync('node puppeteer-scheduler.js install', { stdio: 'inherit' });
        }
        console.log('');
        
        // Step 3: Test the system
        console.log('🧪 Step 3: Testing live Calendly access...');
        console.log('This will test browser automation with your Calendly page...');
        console.log('');
        
        execSync('node test-puppeteer.js', { stdio: 'inherit' });
        
        console.log('');
        console.log('🎉 SETUP COMPLETE!');
        console.log('==================');
        console.log('');
        console.log('🚀 Quick Start:');
        console.log('node puppeteer-scheduler.js start     # Start monitoring');
        console.log('node puppeteer-scheduler.js check     # Check once');
        console.log('node puppeteer-scheduler.js earliest  # Find earliest available');
        console.log('');
        console.log('📖 Full Documentation: PUPPETEER-SOLUTION.md');
        console.log('');
        console.log('✅ Your scheduler is now ready to get LIVE data from Calendly!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.log('');
        console.log('🔧 Manual Setup:');
        console.log('1. npm install puppeteer');
        console.log('2. node test-puppeteer.js');
        console.log('3. node puppeteer-scheduler.js start');
        console.log('');
        console.log('💡 If Puppeteer fails to install, you may need:');
        console.log('• sudo npm install puppeteer (Linux/Mac)');
        console.log('• Run as Administrator (Windows)');
        console.log('• Check internet connection for Chromium download');
    }
}

setupPuppeteerSolution();