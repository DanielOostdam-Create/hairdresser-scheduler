#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function keepBrowserOpen() {
    console.log('🔍 Opening browser and keeping it open...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to the correct URL
        const url = 'https://calendly.com/kapper_eric/30min?month=2025-08';
        console.log(`📅 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for calendar to load
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        console.log('📅 Calendar loaded');
        
        // Wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Browser is now open and ready');
        console.log('🔍 You can now inspect the page manually');
        console.log('📋 Press Ctrl+C to close the browser when done');
        
        // Keep the process alive
        await new Promise((resolve) => {
            process.on('SIGINT', () => {
                console.log('\\n🔒 Closing browser...');
                browser.close().then(() => {
                    console.log('✅ Browser closed');
                    resolve();
                });
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        await browser.close();
    }
}

keepBrowserOpen();