#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function debugCalendlyContent() {
    console.log('🔍 Debugging Calendly content extraction...');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser for debugging
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ],
        timeout: 30000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    try {
        // Test September 2025 where you said there should be an appointment
        const url = 'https://calendly.com/kapper_eric/30min?back=1&month=2025-09';
        console.log(`📅 Loading: ${url}`);
        
        await page.goto(url, { 
            waitUntil: 'networkidle2',
            timeout: 45000 
        });
        
        console.log('⏳ Waiting for calendar...');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🔍 Extracting all button elements...');
        const buttonInfo = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const buttonData = [];
            
            buttons.forEach((button, index) => {
                const ariaLabel = button.getAttribute('aria-label');
                const textContent = button.textContent?.trim();
                const className = button.className;
                
                if (ariaLabel || textContent) {
                    buttonData.push({
                        index,
                        ariaLabel,
                        textContent,
                        className: className.substring(0, 100) // Limit length
                    });
                }
            });
            
            return buttonData;
        });
        
        console.log(`\n📊 Found ${buttonInfo.length} buttons with content`);
        
        // Look for buttons that might contain appointment data
        const appointmentButtons = buttonInfo.filter(btn => 
            btn.ariaLabel?.includes('beschikbare') || 
            btn.ariaLabel?.includes('available') ||
            btn.textContent?.match(/\d{1,2}/) || // Contains numbers (dates)
            btn.className?.includes('available') ||
            btn.className?.includes('date')
        );
        
        console.log(`\n🎯 Found ${appointmentButtons.length} potential appointment buttons:`);
        appointmentButtons.forEach((btn, i) => {
            console.log(`${i + 1}. aria-label: "${btn.ariaLabel}"`);
            console.log(`   text: "${btn.textContent}"`);
            console.log(`   class: "${btn.className}"`);
            console.log('');
        });
        
        // Save page HTML for manual inspection
        const html = await page.content();
        await fs.writeFile('/Users/danieloostdam/Desktop/hairdresser-scheduler/debug-september-2025.html', html);
        console.log('💾 Page HTML saved to debug-september-2025.html');
        
        // Take screenshot
        await page.screenshot({ 
            path: '/Users/danieloostdam/Desktop/hairdresser-scheduler/debug-september-2025.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved to debug-september-2025.png');
        
        // Test the current date extraction logic
        console.log('\n🧪 Testing current date extraction logic...');
        const currentLogicResult = await page.evaluate(() => {
            const dates = [];
            const buttons = document.querySelectorAll('button[aria-label*="beschikbare tijden"]');
            
            console.log(`Found ${buttons.length} buttons with "beschikbare tijden"`);
            
            buttons.forEach(button => {
                const ariaLabel = button.getAttribute('aria-label');
                if (ariaLabel) {
                    console.log(`Processing: ${ariaLabel}`);
                    const match = ariaLabel.match(/(\w+),\s+(\w+)\s+(\d{1,2})\s*-\s*beschikbare tijden/);
                    if (match) {
                        const [, dayName, monthName, day] = match;
                        console.log(`Matched: ${dayName}, ${monthName}, ${day}`);
                        
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
                    }
                }
            });
            
            return [...new Set(dates)].sort();
        });
        
        console.log(`\n📅 Current logic found: ${currentLogicResult.length} dates`);
        if (currentLogicResult.length > 0) {
            console.log(`Dates: ${currentLogicResult.join(', ')}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

debugCalendlyContent().catch(console.error);