#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testScheduler() {
    console.log('🔍 Testing scheduler fix...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        const url = 'https://calendly.com/kapper_eric/30min?month=2025-08';
        console.log(`📅 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        console.log('📅 Calendar loaded');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const availableDates = await page.evaluate(() => {
            const dates = [];
            const debugInfo = [];
            const allButtons = document.querySelectorAll('button');
            
            allButtons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('beschikbare tijden') && !ariaLabel.includes('geen beschikbare tijden')) {
                    debugInfo.push(`Found available button: "${ariaLabel}"`);
                    
                    // Use the correct regex pattern
                    const match = ariaLabel.match(/(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/);
                    if (match) {
                        const [, dayName, monthName, day] = match;
                        debugInfo.push(`Regex matched: day=${dayName}, month=${monthName}, day=${day}`);
                        
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
                            dates.push(dateStr);
                            debugInfo.push(`Added date: ${dateStr}`);
                        } else {
                            debugInfo.push(`Month not found: ${monthName}`);
                        }
                    } else {
                        debugInfo.push(`Regex didn't match: "${ariaLabel}"`);
                    }
                }
            });
            
            return { dates, debugInfo };
        });
        
        console.log('🔍 Debug info:');
        availableDates.debugInfo.forEach(info => console.log(`  ${info}`));
        console.log(`🎯 Found ${availableDates.dates.length} dates:`, availableDates.dates);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

testScheduler();