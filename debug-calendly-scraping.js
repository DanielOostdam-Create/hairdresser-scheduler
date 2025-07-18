#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class CalendlyDebugger {
    constructor() {
        this.calendlyUrl = 'https://calendly.com/kapper_eric/30min?back=1';
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async debugMonth(monthOffset = 0) {
        console.log(`\n🔍 DEBUGGING MONTH +${monthOffset}`);
        console.log('=====================================');
        
        const browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        
        try {
            await page.setViewport({ width: 1280, height: 720 });
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + monthOffset);
            const monthParam = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            
            const url = `${this.calendlyUrl}&month=${monthParam}`;
            console.log(`📅 URL: ${url}`);
            
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 45000 
            });
            
            console.log('⏳ Waiting for page to load...');
            await this.delay(3000);
            
            // Try to find calendar element
            console.log('\n🔍 Looking for calendar element...');
            try {
                await page.waitForSelector('[data-testid="calendar"]', { timeout: 20000 });
                console.log('✅ Calendar element found');
            } catch (error) {
                console.log('❌ Calendar element not found');
            }
            
            await this.delay(5000); // Extra wait for dynamic content
            
            // Take screenshot for visual debugging
            const screenshotPath = `debug-screenshot-${monthParam}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`📸 Screenshot saved: ${screenshotPath}`);
            
            // Debug: Show all buttons with aria-labels
            console.log('\n🔍 Finding all buttons with aria-labels...');
            const allButtons = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button[aria-label]');
                const buttonInfo = [];
                
                buttons.forEach((button, index) => {
                    const ariaLabel = button.getAttribute('aria-label');
                    const textContent = button.textContent.trim();
                    const className = button.className;
                    
                    buttonInfo.push({
                        index: index,
                        ariaLabel: ariaLabel,
                        textContent: textContent,
                        className: className
                    });
                });
                
                return buttonInfo;
            });
            
            console.log(`📋 Found ${allButtons.length} buttons with aria-labels:`);
            allButtons.forEach((btn, i) => {
                if (i < 10) { // Show first 10
                    console.log(`  ${i}: "${btn.ariaLabel}" | Text: "${btn.textContent}"`);
                }
            });
            
            if (allButtons.length > 10) {
                console.log(`  ... and ${allButtons.length - 10} more buttons`);
            }
            
            // Look for buttons with "available" or "beschikbare" text
            console.log('\n🔍 Filtering for availability buttons...');
            const availabilityButtons = allButtons.filter(btn => 
                btn.ariaLabel.toLowerCase().includes('available') || 
                btn.ariaLabel.toLowerCase().includes('beschikbare') ||
                btn.textContent.includes('AM') ||
                btn.textContent.includes('PM') ||
                btn.textContent.match(/\d{1,2}:\d{2}/)
            );
            
            console.log(`📋 Found ${availabilityButtons.length} potential availability buttons:`);
            availabilityButtons.forEach((btn, i) => {
                console.log(`  ${i}: "${btn.ariaLabel}" | Text: "${btn.textContent}"`);
            });
            
            // Try different selectors
            console.log('\n🔍 Trying different selectors...');
            
            const selectors = [
                'button[aria-label*="beschikbare tijden"]',
                'button[aria-label*="available times"]',
                'button[aria-label*="available"]',
                'button[data-testid*="date"]',
                'button[data-testid*="time"]',
                '[data-testid="calendar"] button',
                'button:has-text("AM")',
                'button:has-text("PM")'
            ];
            
            for (const selector of selectors) {
                try {
                    const elements = await page.$$(selector);
                    console.log(`  "${selector}": ${elements.length} elements`);
                } catch (error) {
                    console.log(`  "${selector}": Error - ${error.message}`);
                }
            }
            
            // Get page HTML for offline analysis
            console.log('\n📄 Saving page HTML for analysis...');
            const html = await page.content();
            const htmlPath = `debug-page-${monthParam}.html`;
            await fs.writeFile(htmlPath, html);
            console.log(`📄 HTML saved: ${htmlPath}`);
            
            // Try to find any clickable dates in the calendar
            console.log('\n🔍 Looking for clickable calendar dates...');
            const calendarDates = await page.evaluate(() => {
                const results = [];
                
                // Look for various date-related elements
                const dateSelectors = [
                    '[data-testid="calendar"] button',
                    '[role="button"]',
                    '.calendar button',
                    'button[data-date]',
                    'td button',
                    'div[role="button"]'
                ];
                
                dateSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach((el, index) => {
                            const text = el.textContent.trim();
                            const ariaLabel = el.getAttribute('aria-label') || '';
                            const dataAttrs = {};
                            
                            // Get all data attributes
                            for (let attr of el.attributes) {
                                if (attr.name.startsWith('data-')) {
                                    dataAttrs[attr.name] = attr.value;
                                }
                            }
                            
                            if (text || ariaLabel) {
                                results.push({
                                    selector: selector,
                                    index: index,
                                    text: text,
                                    ariaLabel: ariaLabel,
                                    dataAttrs: dataAttrs
                                });
                            }
                        });
                    } catch (err) {
                        // Ignore selector errors
                    }
                });
                
                return results;
            });
            
            console.log(`📋 Found ${calendarDates.length} potential calendar date elements:`);
            calendarDates.slice(0, 20).forEach((el, i) => {
                console.log(`  ${i}: Text="${el.text}" | AriaLabel="${el.ariaLabel}" | Selector="${el.selector}"`);
                if (Object.keys(el.dataAttrs).length > 0) {
                    console.log(`      Data attrs: ${JSON.stringify(el.dataAttrs)}`);
                }
            });
            
            console.log('\n⏸️  Browser will stay open for 30 seconds for manual inspection...');
            await this.delay(30000);
            
        } catch (error) {
            console.error('❌ Error during debugging:', error.message);
        } finally {
            await browser.close();
        }
    }

    async debugCurrentMonth() {
        await this.debugMonth(1); // July (current + 1)
    }
}

// Run the debug tool
async function main() {
    const debugTool = new CalendlyDebugger();
    
    console.log('🔬 CALENDLY SCRAPING DEBUGGER');
    console.log('==============================');
    console.log('This will:');
    console.log('• Open browser visually');
    console.log('• Take screenshots');
    console.log('• Save HTML for analysis');
    console.log('• Show all buttons and selectors');
    console.log('• Keep browser open for 30 seconds');
    console.log('');
    
    await debugTool.debugCurrentMonth();
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check the screenshot to see the page visually');
    console.log('2. Look at the HTML file to see the actual structure');
    console.log('3. Check the button listings above for the correct selector');
    console.log('');
}

if (require.main === module) {
    main().catch(console.error);
}