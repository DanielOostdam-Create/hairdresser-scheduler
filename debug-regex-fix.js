#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testRegexFix() {
    console.log('🔍 Testing regex fix...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to August 2025 where we know there's availability on the 14th
        const url = 'https://calendly.com/kapper_eric/30min?month=2025-08';
        console.log(`📅 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Wait for calendar to load
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        console.log('📅 Calendar loaded');
        
        // Wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Test the regex pattern
        const availableDates = await page.evaluate(() => {
            const dates = [];
            const allButtons = document.querySelectorAll('button');
            
            console.log('🔍 Testing buttons...');
            
            allButtons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel && ariaLabel.includes('beschikbare tijden') && !ariaLabel.includes('geen beschikbare tijden')) {
                    console.log(`✅ Found available date button: "${ariaLabel}"`);
                    
                    // Test the regex pattern
                    const match = ariaLabel.match(/(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/);
                    if (match) {
                        console.log(`✅ Regex matched:`, match);
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
                            console.log(`✅ Parsed date: ${dateStr}`);
                            dates.push(dateStr);
                        } else {
                            console.log(`❌ Could not parse month: ${monthName}`);
                        }
                    } else {
                        console.log(`❌ Regex did not match: "${ariaLabel}"`);
                    }
                }
            });
            
            return dates;
        });
        
        console.log(`🎯 Found ${availableDates.length} available dates:`, availableDates);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

testRegexFix();