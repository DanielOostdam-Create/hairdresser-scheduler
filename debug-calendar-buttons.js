#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function debugCalendarButtons() {
    console.log('🔍 Debugging calendar button structure...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to August 2025 where we know there's availability on the 14th
        const url = 'https://calendly.com/kapper_eric/30min?back=1&month=2025-08';
        console.log(`📅 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for calendar to load
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        console.log('📅 Calendar loaded');
        
        // Wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extract ALL button information
        const buttonInfo = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const info = [];
            
            buttons.forEach((button, index) => {
                const ariaLabel = button.getAttribute('aria-label');
                const textContent = button.textContent?.trim();
                const className = button.className;
                
                if (ariaLabel || textContent) {
                    info.push({
                        index,
                        ariaLabel,
                        textContent,
                        className,
                        hasDescriptions: ariaLabel && ariaLabel.includes('beschikbare tijden'),
                        hasAvailable: ariaLabel && ariaLabel.includes('available'),
                        hasTimeSlots: ariaLabel && (ariaLabel.includes('time') || ariaLabel.includes('tijd'))
                    });
                }
            });
            
            return info;
        });
        
        console.log('📊 Button Analysis:');
        console.log('===================');
        
        // Show buttons that might contain date info
        const relevantButtons = buttonInfo.filter(btn => 
            btn.ariaLabel && (
                btn.ariaLabel.includes('beschikbare') || 
                btn.ariaLabel.includes('available') ||
                btn.ariaLabel.includes('time') ||
                btn.ariaLabel.includes('14') ||
                btn.ariaLabel.includes('August') ||
                btn.ariaLabel.includes('augustus')
            )
        );
        
        console.log(`Found ${relevantButtons.length} potentially relevant buttons:`);
        relevantButtons.forEach(btn => {
            console.log(`  Button ${btn.index}:`);
            console.log(`    Aria: "${btn.ariaLabel}"`);
            console.log(`    Text: "${btn.textContent}"`);
            console.log(`    Class: "${btn.className}"`);
            console.log('');
        });
        
        // Also check if there are any buttons with just numbers (14)
        const numberButtons = buttonInfo.filter(btn => 
            btn.textContent && /^\d{1,2}$/.test(btn.textContent)
        );
        
        console.log(`Found ${numberButtons.length} number buttons:`);
        numberButtons.forEach(btn => {
            console.log(`  Button ${btn.index}: "${btn.textContent}" - Aria: "${btn.ariaLabel}"`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

debugCalendarButtons();