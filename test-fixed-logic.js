#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testFixedLogic() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://calendly.com/kapper_eric/30min?back=1&month=2025-10');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const results = await page.evaluate(() => {
            const dates = [];
            const allButtons = document.querySelectorAll('button');
            
            allButtons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('beschikbare tijden') && !ariaLabel.includes('geen beschikbare tijden')) {
                    const match = ariaLabel.match(/(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s*-\\s*beschikbare tijden/);
                    if (match) {
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
                            dates.push(dateStr);
                        }
                    }
                }
            });
            
            return dates;
        });
        
        console.log('✅ Found dates:', results);
        
        // Wait for manual inspection
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testFixedLogic().catch(console.error);