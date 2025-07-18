#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testExactLogic() {
    console.log('🔍 Testing exact logic from main scheduler...');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--single-process'
        ],
        timeout: 30000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    try {
        const url = 'https://calendly.com/kapper_eric/30min?back=1&month=2025-09';
        console.log(`📅 Loading: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 45000 
        });
        
        console.log('⏳ Waiting for calendar...');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        
        console.log('⏳ Loading dynamic content...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🔍 Extracting dates with EXACT main logic...');
        const availableDates = await page.evaluate(() => {
            const dates = [];
            const buttons = document.querySelectorAll('button[aria-label*="beschikbare tijden"]');
            
            console.log(`Found ${buttons.length} buttons with beschikbare tijden`);
            
            buttons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel) {
                    console.log(`Processing: ${ariaLabel}`);
                    const match = ariaLabel.match(/(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s*-\\s*beschikbare tijden/);
                    if (match) {
                        console.log(`Matched: ${match}`);
                        const [, dayName, monthName, day] = match;
                        
                        const monthMap = {
                            'January': '01', 'February': '02', 'March': '03', 'April': '04',
                            'May': '05', 'June': '06', 'July': '07', 'August': '08',
                            'September': '09', 'October': '10', 'November': '11', 'December': '12',
                            'januari': '01', 'februari': '02', 'maart': '03', 'april': '04',
                            'mei': '05', 'juni': '06', 'juli': '07', 'augustus': '08',
                            'september': '09', 'oktober': '10', 'november': '11', 'december': '12'
                        };
                        
                        const monthNum = monthMap[monthName] || monthMap[monthName.toLowerCase()];
                        if (monthNum) {
                            const year = 2025;
                            const dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
                            console.log(`Created date: ${dateStr}`);
                            dates.push(dateStr);
                        }
                    } else {
                        console.log(`No match for: ${ariaLabel}`);
                    }
                }
            });
            
            return [...new Set(dates)].sort();
        });
        
        console.log(`\\n✅ Found ${availableDates.length} dates`);
        if (availableDates.length > 0) {
            console.log(`📋 Dates: ${availableDates.join(', ')}`);
        }
        
        // Test if the issue is with the browser args
        console.log('\\n🔍 Testing alternative method...');
        const alternativeResult = await page.evaluate(() => {
            const dates = [];
            const allButtons = document.querySelectorAll('button');
            
            allButtons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('beschikbare tijden')) {
                    console.log(`Found available button: ${ariaLabel}`);
                    // Simple extraction without complex regex
                    if (ariaLabel.includes('September 30')) {
                        dates.push('2025-09-30');
                    }
                }
            });
            
            return dates;
        });
        
        console.log(`\\n🎯 Alternative method found: ${alternativeResult.length} dates`);
        if (alternativeResult.length > 0) {
            console.log(`📋 Dates: ${alternativeResult.join(', ')}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testExactLogic().catch(console.error);