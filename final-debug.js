#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function finalDebug() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Final debug - checking actual current date...');
        
        // First check what Calendly shows for "today"
        await page.goto('https://calendly.com/kapper_eric/30min?back=1');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const todayInfo = await page.evaluate(() => {
            const today = new Date();
            const currentMonth = today.getMonth() + 1;
            const currentYear = today.getFullYear();
            return {
                jsDate: today.toISOString().split('T')[0],
                month: currentMonth,
                year: currentYear,
                monthStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}`
            };
        });
        
        console.log('📅 JavaScript date info:', todayInfo);
        
        // Now let's check what month Calendly actually shows by default
        const defaultMonth = await page.evaluate(() => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('month') || 'default';
        });
        
        console.log('📅 Default month shown:', defaultMonth);
        
        // Check if Sept 30 exists by direct navigation
        console.log('🔍 Checking September 2025 specifically...');
        await page.goto('https://calendly.com/kapper_eric/30min?back=1&month=2025-09');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const sepResults = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const results = [];
            
            buttons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel) {
                    if (ariaLabel.includes('30') || ariaLabel.includes('September')) {
                        results.push({
                            ariaLabel,
                            text: button.textContent?.trim(),
                            hasAvailable: ariaLabel.includes('beschikbare tijden')
                        });
                    }
                }
            });
            
            return results;
        });
        
        console.log('📅 September 30 search results:');
        sepResults.forEach(result => {
            console.log(`  - "${result.ariaLabel}" | Available: ${result.hasAvailable}`);
        });
        
        // Check if maybe the date has changed
        console.log('🔍 Checking October 2025...');
        await page.goto('https://calendly.com/kapper_eric/30min?back=1&month=2025-10');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const octResults = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const availableButtons = [];
            
            buttons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('beschikbare tijden')) {
                    availableButtons.push({
                        ariaLabel,
                        text: button.textContent?.trim()
                    });
                }
            });
            
            return availableButtons;
        });
        
        console.log('📅 October available appointments:');
        octResults.forEach(result => {
            console.log(`  - "${result.ariaLabel}"`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

finalDebug().catch(console.error);