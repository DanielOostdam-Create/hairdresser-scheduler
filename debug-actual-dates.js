#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugActualDates() {
    console.log('🔍 Debugging actual dates in October 2025...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to October 2025 where we know there are dates
        const url = 'https://calendly.com/kapper_eric/30min?month=2025-10';
        console.log(`📅 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for calendar to load
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        console.log('📅 Calendar loaded');
        
        // Wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extract ALL button information to see what's actually there
        const buttonInfo = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const allButtons = [];
            
            buttons.forEach((button, index) => {
                const ariaLabel = button.getAttribute('aria-label');
                const textContent = button.textContent?.trim();
                
                if (ariaLabel || textContent) {
                    allButtons.push({
                        index,
                        ariaLabel,
                        textContent,
                        hasAvailable: ariaLabel && ariaLabel.includes('beschikbare'),
                        hasNoAvailable: ariaLabel && ariaLabel.includes('geen beschikbare')
                    });
                }
            });
            
            return allButtons;
        });
        
        console.log('\\n📊 All buttons with aria-labels:');
        console.log('=================================');
        
        const availableButtons = buttonInfo.filter(btn => btn.hasAvailable && !btn.hasNoAvailable);
        const unavailableButtons = buttonInfo.filter(btn => btn.hasNoAvailable);
        
        console.log(`\\n✅ AVAILABLE buttons (${availableButtons.length}):`);
        availableButtons.forEach(btn => {
            console.log(`  "${btn.ariaLabel}"`);
        });
        
        console.log(`\\n❌ UNAVAILABLE buttons (first 5 of ${unavailableButtons.length}):`);
        unavailableButtons.slice(0, 5).forEach(btn => {
            console.log(`  "${btn.ariaLabel}"`);
        });
        
        // Test the regex on actual available buttons
        if (availableButtons.length > 0) {
            console.log('\\n🧪 Testing regex patterns on actual available buttons:');
            availableButtons.forEach((btn, i) => {
                console.log(`\\n  Button ${i + 1}: "${btn.ariaLabel}"`);
                
                // Current pattern
                const currentPattern = /(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/;
                const match = btn.ariaLabel.match(currentPattern);
                
                if (match) {
                    console.log(`    ✅ MATCHED: day="${match[1]}", month="${match[2]}", date="${match[3]}"`);
                } else {
                    console.log(`    ❌ NO MATCH with current pattern`);
                }
            });
        }
        
        // Keep browser open for manual inspection
        console.log('\\n🔍 Browser is open for manual inspection');
        console.log('Press Ctrl+C to close...');
        
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

debugActualDates();