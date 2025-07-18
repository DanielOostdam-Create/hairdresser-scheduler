#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');

class WorkingScheduler {
    constructor() {
        this.dataFile = path.join(__dirname, 'appointments.json');
        this.calendlyUrl = 'https://calendly.com/kapper_eric/30min?back=1';
        this.checkInterval = 60 * 60 * 1000; // 1 hour
        this.isRunning = false;
        this.consecutiveErrors = 0;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async scrapeCalendlyMonth(monthOffset = 0) {
        let browser;
        try {
            console.log(`📅 Scraping month +${monthOffset}...`);
            
            // Launch browser with working configuration
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ],
                timeout: 30000
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 720 });
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + monthOffset);
            const monthParam = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            
            const url = `${this.calendlyUrl}&month=${monthParam}`;
            console.log(`🌐 Loading: ${url}`);
            
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 45000 
            });
            
            await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
            await this.delay(5000);
            
            const availableDates = await page.evaluate(() => {
                const dates = [];
                const allButtons = document.querySelectorAll('button');
                
                allButtons.forEach(button => {
                    const ariaLabel = button.getAttribute('aria-label');
                    if (ariaLabel && ariaLabel.includes('beschikbare tijden')) {
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
                
                return [...new Set(dates)].sort();
            });
            
            console.log(`✅ Found ${availableDates.length} dates in ${monthParam}`);
            if (availableDates.length > 0) {
                console.log(`📋 Dates: ${availableDates.join(', ')}`);
            }
            
            return availableDates;
            
        } catch (error) {
            console.error(`❌ Error scraping month +${monthOffset}:`, error.message);
            return [];
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async checkMultipleMonths(monthsToCheck = 4) {
        const allDates = [];
        
        console.log(`🗓️ Checking ${monthsToCheck} months...`);
        
        for (let i = 0; i < monthsToCheck; i++) {
            const monthDates = await this.scrapeCalendlyMonth(i);
            allDates.push(...monthDates);
            
            if (i < monthsToCheck - 1) {
                await this.delay(2000);
            }
        }
        
        return [...new Set(allDates)].sort();
    }

    findEarliestAvailable(availableDates) {
        if (!availableDates || availableDates.length === 0) {
            return {
                available: false,
                earliestDate: null,
                daysFromNow: null,
                totalAvailable: 0
            };
        }

        const today = new Date().toISOString().split('T')[0];
        const futureDates = availableDates.filter(date => date >= today);
        
        if (futureDates.length === 0) {
            return {
                available: false,
                earliestDate: null,
                daysFromNow: null,
                totalAvailable: availableDates.length,
                note: 'All available dates are in the past'
            };
        }

        const sortedDates = futureDates.sort();
        const earliestDate = sortedDates[0];
        
        const todayDate = new Date(today);
        const earliest = new Date(earliestDate);
        const diffTime = earliest - todayDate;
        const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            available: true,
            earliestDate: earliestDate,
            daysFromNow: daysFromNow,
            totalAvailable: futureDates.length,
            allDates: sortedDates.slice(0, 10)
        };
    }

    async testEarliest() {
        try {
            const availableDates = await this.checkMultipleMonths(4);
            
            console.log(`\\n🎯 RESULTS:`);
            console.log(`📅 Found ${availableDates.length} total available dates`);

            const earliestInfo = this.findEarliestAvailable(availableDates);
            
            if (earliestInfo.available) {
                console.log(`⚡ Earliest available: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
                console.log(`📅 All dates: ${earliestInfo.allDates.join(', ')}`);
            } else {
                console.log('⚡ No future appointments currently available');
            }
            
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

// CLI Interface
async function main() {
    const scheduler = new WorkingScheduler();
    const command = process.argv[2];

    switch (command) {
        case 'earliest':
            console.log('🔍 Finding earliest appointment...');
            await scheduler.testEarliest();
            break;
            
        default:
            console.log('Working Scheduler Test');
            console.log('Usage: node hairdresser-scheduler-working.js earliest');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WorkingScheduler;