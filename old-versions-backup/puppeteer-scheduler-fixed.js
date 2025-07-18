#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class PuppeteerCalendlyScheduler {
    constructor() {
        this.dataFile = path.join(__dirname, 'appointments.json');
        this.calendlyUrl = 'https://calendly.com/kapper_eric/30min?back=1';
        this.checkInterval = 60 * 60 * 1000; // 1 hour
        this.isRunning = false;
        this.puppeteer = null;
        this.browser = null;
    }

    async initializePuppeteer() {
        try {
            console.log('🔧 Initializing Puppeteer...');
            this.puppeteer = require('puppeteer');
            console.log('✅ Puppeteer loaded successfully');
        } catch (error) {
            console.error('❌ Puppeteer not found. Installing...');
            await this.installPuppeteer();
            this.puppeteer = require('puppeteer');
        }
    }

    async installPuppeteer() {
        const { execSync } = require('child_process');
        console.log('📦 Installing Puppeteer (this may take a few minutes)...');
        try {
            execSync('npm install puppeteer', { stdio: 'inherit' });
            console.log('✅ Puppeteer installed successfully');
        } catch (error) {
            console.error('❌ Failed to install Puppeteer:', error.message);
            console.log('💡 Please install manually: npm install puppeteer');
            process.exit(1);
        }
    }

    async launchBrowser() {
        if (!this.browser) {
            console.log('🚀 Launching browser...');
            this.browser = await this.puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-extensions'
                ]
            });
            console.log('✅ Browser launched');
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            console.log('🔒 Browser closed');
        }
    }

    async scrapeCalendlyWithPuppeteer(monthOffset = 0) {
        const browser = await this.launchBrowser();
        const page = await browser.newPage();
        
        try {
            // Set viewport and user agent
            await page.setViewport({ width: 1280, height: 720 });
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Calculate target month
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + monthOffset);
            const monthParam = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            
            const url = `${this.calendlyUrl}&month=${monthParam}`;
            console.log(`📅 Scraping: ${url}`);
            
            // Navigate to page with longer timeout
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 45000 
            });
            
            // Wait for calendar to load - using correct Puppeteer method
            console.log('⏳ Waiting for calendar to load...');
            
            try {
                // Try multiple selectors to find the calendar
                await Promise.race([
                    page.waitForSelector('[data-testid="calendar"]', { timeout: 15000 }),
                    page.waitForSelector('table[aria-label*="Kies een dag"]', { timeout: 15000 }),
                    page.waitForSelector('button[aria-label*="beschikbare tijden"]', { timeout: 15000 }),
                    page.waitForSelector('button[aria-label*="geen beschikbare"]', { timeout: 15000 })
                ]);
                console.log('✅ Calendar element found');
            } catch (selectorError) {
                console.log('⚠️ Calendar selector not found, waiting additional time...');
            }
            
            // Additional wait using the correct method - setTimeout instead of waitForTimeout
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Extract available dates
            console.log('🔍 Extracting available dates...');
            
            // Debug: Take a screenshot to see what we're getting
            await page.screenshot({ path: `debug-${monthParam}.png`, fullPage: false });
            console.log(`📸 Screenshot saved as debug-${monthParam}.png`);
            
            const availableDates = await page.evaluate(() => {
                const dates = [];
                
                console.log('🔍 Starting page evaluation...');
                
                // Look for buttons with "beschikbare tijden" (available times)
                const availableButtons = document.querySelectorAll('button[aria-label*="beschikbare tijden"]');
                console.log(`Found ${availableButtons.length} buttons with "beschikbare tijden"`);
                
                availableButtons.forEach((button, index) => {
                    const ariaLabel = button.getAttribute('aria-label');
                    console.log(`Button ${index + 1}: ${ariaLabel}`);
                    
                    if (ariaLabel) {
                        // Parse date from aria-label like "Friday, August 1 - beschikbare tijden"
                        const match = ariaLabel.match(/(\w+),\s+(\w+)\s+(\d{1,2})\s*-\s*beschikbare tijden/);
                        if (match) {
                            const [, dayName, monthName, day] = match;
                            
                            // Month mapping
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
                                console.log(`Parsed date: ${dateStr}`);
                            }
                        }
                    }
                });
                
                // Also look for any button with aria-label containing a date
                const allButtons = document.querySelectorAll('button[aria-label]');
                console.log(`Total buttons with aria-label: ${allButtons.length}`);
                
                // Sample a few aria-labels for debugging
                for (let i = 0; i < Math.min(10, allButtons.length); i++) {
                    const label = allButtons[i].getAttribute('aria-label');
                    if (label.includes('August') || label.includes('July') || label.includes('augustus') || label.includes('juli')) {
                        console.log(`Sample button ${i}: ${label}`);
                    }
                }
                
                const uniqueDates = [...new Set(dates)].sort();
                console.log(`Extracted ${uniqueDates.length} unique dates: ${uniqueDates.join(', ')}`);
                return uniqueDates;
            });
            
            console.log(`✅ Found ${availableDates.length} available dates in ${monthParam}`);
            if (availableDates.length > 0) {
                console.log(`📋 Dates: ${availableDates.join(', ')}`);
            } else {
                console.log(`⚠️ No available dates found in ${monthParam}`);
                
                // Debug: Check page content
                const pageContent = await page.content();
                const hasCalendlyContent = pageContent.includes('calendly');
                const hasButtons = pageContent.includes('<button');
                const hasAriaLabels = pageContent.includes('aria-label');
                const hasDutchText = pageContent.includes('beschikbare') || pageContent.includes('geen beschikbare');
                
                console.log(`📊 Page analysis:`);
                console.log(`   Contains Calendly: ${hasCalendlyContent}`);
                console.log(`   Contains buttons: ${hasButtons}`);
                console.log(`   Contains aria-labels: ${hasAriaLabels}`);
                console.log(`   Contains Dutch text: ${hasDutchText}`);
                console.log(`   Page size: ${pageContent.length} characters`);
            }
            
            return availableDates;
            
        } catch (error) {
            console.error(`❌ Error scraping ${monthOffset ? 'month +' + monthOffset : 'current month'}:`, error.message);
            
            // Take error screenshot
            try {
                await page.screenshot({ path: `error-${Date.now()}.png`, fullPage: false });
                console.log('📸 Error screenshot saved');
            } catch (screenshotError) {
                // Ignore screenshot errors
            }
            
            return [];
        } finally {
            await page.close();
        }
    }

    async checkMultipleMonths(monthsToCheck = 3) {
        await this.initializePuppeteer();
        const allDates = [];
        
        console.log(`🗓️ Checking ${monthsToCheck} months with Puppeteer...`);
        
        for (let i = 0; i < monthsToCheck; i++) {
            const monthDates = await this.scrapeCalendlyWithPuppeteer(i);
            allDates.push(...monthDates);
            
            // Small delay between requests
            if (i < monthsToCheck - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        return [...new Set(allDates)].sort();
    }

    async loadData() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading data:', error.message);
            return null;
        }
    }

    async saveData(data) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving data:', error.message);
            return false;
        }
    }

    isTargetWeekAvailable(availableDates, targetDate) {
        const target = new Date(targetDate);
        const dayOfWeek = target.getDay();
        
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(target);
        weekStart.setDate(target.getDate() + mondayOffset);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const availableInWeek = availableDates.filter(date => {
            return date >= weekStartStr && date <= weekEndStr;
        });
        
        return {
            available: availableInWeek.length > 0,
            dates: availableInWeek,
            weekStart: weekStartStr,
            weekEnd: weekEndStr
        };
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

    async checkAppointmentAvailability() {
        const data = await this.loadData();
        if (!data) {
            console.log('❌ Could not load appointment data');
            return;
        }

        if (data.nextAppointment) {
            console.log(`✅ Next appointment already scheduled for: ${data.nextAppointment}`);
            return;
        }

        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`🔍 Checking availability for target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        
        try {
            const availableDates = await this.checkMultipleMonths(3);
            
            console.log(`\n🎯 LIVE RESULTS FROM CALENDLY:`);
            console.log(`📅 Found ${availableDates.length} total available dates`);

            const weekAvailability = this.isTargetWeekAvailable(availableDates, data.targetDate);
            const earliestInfo = this.findEarliestAvailable(availableDates);
            
            if (earliestInfo.available) {
                console.log(`⚡ Earliest available: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
                
                if (earliestInfo.allDates.length > 1) {
                    console.log(`📅 Next few dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}`);
                }
            } else {
                console.log('⚡ No future appointments currently available');
            }
            
            const now = new Date().toISOString();
            data.lastChecked = now;

            if (weekAvailability.available) {
                const datesStr = weekAvailability.dates.join(', ');
                const message = `🎉 TARGET WEEK AVAILABLE! Found ${weekAvailability.dates.length} appointment(s) in target week (${weekAvailability.weekStart} to ${weekAvailability.weekEnd}): ${datesStr}`;
                console.log(`\n${message}`);
                
                data.notifications.push({
                    timestamp: now,
                    type: 'available',
                    message: message,
                    targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                    availableDates: weekAvailability.dates,
                    earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                    earliestDaysFromNow: earliestInfo.available ? earliestInfo.daysFromNow : null,
                    totalAvailable: earliestInfo.totalAvailable,
                    scrapingMethod: 'puppeteer-fixed'
                });
            } else {
                const message = `⏳ Target week (${weekAvailability.weekStart} to ${weekAvailability.weekEnd}) not yet available. Will check again in 1 hour.`;
                console.log(`\n${message}`);
                
                if (earliestInfo.available) {
                    console.log(`🕰️ Note: Earliest available is ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                }
                
                const lastNotAvailable = data.notifications
                    .filter(n => n.type === 'not_available')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                
                const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                
                if (!lastNotAvailable || new Date(lastNotAvailable.timestamp) < sixHoursAgo) {
                    data.notifications.push({
                        timestamp: now,
                        type: 'not_available',
                        message: message,
                        targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                        availableDatesCount: availableDates.length,
                        earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                        earliestDaysFromNow: earliestInfo.available ? earliestInfo.daysFromNow : null,
                        totalAvailable: earliestInfo.totalAvailable,
                        scrapingMethod: 'puppeteer-fixed'
                    });
                }
            }

            await this.saveData(data);

        } catch (error) {
            console.error('❌ Error checking Calendly with Puppeteer:', error.message);
            
            const data = await this.loadData();
            if (data) {
                data.notifications.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: `Puppeteer error: ${error.message}`,
                    error: error.message,
                    scrapingMethod: 'puppeteer-fixed'
                });
                await this.saveData(data);
            }
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️ Scheduler is already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting FIXED Puppeteer-Based Hairdresser Appointment Scheduler');
        console.log('🔧 This version fixes the waitForTimeout issue and adds debugging');
        
        const data = await this.loadData();
        if (data) {
            const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
            console.log(`📅 Target appointment week: ${weekInfo.weekStart} to ${weekInfo.weekEnd} (6 weeks after last appointment)`);
        }
        
        console.log(`🔄 Will check every hour using fixed Puppeteer`);
        console.log(`🌐 Monitoring: ${this.calendlyUrl}`);
        console.log('');

        // Initial check
        await this.checkAppointmentAvailability();

        // Set up hourly checking
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.checkAppointmentAvailability();
            }
        }, this.checkInterval);

        console.log('✅ Fixed Puppeteer scheduler started successfully');
        
        // Handle cleanup on exit
        process.on('SIGINT', async () => {
            console.log('\n🛑 Received SIGINT, cleaning up...');
            await this.stop();
            process.exit(0);
        });
    }

    async stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        await this.closeBrowser();
        console.log('🛑 Fixed Puppeteer scheduler stopped');
    }

    async updateLastAppointment(date) {
        const data = await this.loadData();
        if (data) {
            data.lastAppointment = date;
            const lastDate = new Date(date);
            const targetDate = new Date(lastDate);
            targetDate.setDate(lastDate.getDate() + 42);
            data.targetDate = targetDate.toISOString().split('T')[0];
            
            await this.saveData(data);
            console.log(`✅ Updated last appointment to ${date}`);
            console.log(`🎯 New target date: ${data.targetDate}`);
        }
    }

    async setNextAppointment(date) {
        const data = await this.loadData();
        if (data) {
            data.nextAppointment = date;
            await this.saveData(data);
            console.log(`✅ Set next appointment to ${date}`);
        }
    }

    async showStatus() {
        const data = await this.loadData();
        if (!data) {
            console.log('❌ Could not load appointment data');
            return;
        }

        console.log('\n📊 FIXED PUPPETEER APPOINTMENT STATUS');
        console.log('═══════════════════════════════════════════════');
        console.log(`Last appointment: ${data.lastAppointment}`);
        console.log(`Next appointment: ${data.nextAppointment || 'Not scheduled'}`);
        
        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`Target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        console.log(`Target date (reference): ${data.targetDate}`);
        
        console.log(`Last checked: ${data.lastChecked || 'Never'}`);
        console.log(`Total notifications: ${data.notifications.length}`);
        console.log(`Scraping method: Fixed Puppeteer with debugging`);
        
        const recentNotifications = data.notifications
            .filter(n => n.earliestAvailable)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (recentNotifications.length > 0) {
            const latest = recentNotifications[0];
            console.log(`Latest earliest available: ${latest.earliestAvailable} (${latest.earliestDaysFromNow} days from check)`);
            console.log(`Total future appointments: ${latest.totalAvailable}`);
        }
        
        if (data.notifications.length > 0) {
            console.log('\n📱 Recent notifications:');
            data.notifications.slice(-5).forEach(notification => {
                const time = new Date(notification.timestamp).toLocaleString();
                console.log(`  ${time}: ${notification.message}`);
            });
        }
        console.log('');
    }
}

// CLI Interface
async function main() {
    const scheduler = new PuppeteerCalendlyScheduler();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            await scheduler.start();
            break;

        case 'check':
            console.log('🔍 Checking availability with FIXED Puppeteer...');
            await scheduler.checkAppointmentAvailability();
            await scheduler.closeBrowser();
            break;

        case 'earliest':
            console.log('🔍 Finding earliest available appointment with FIXED Puppeteer...');
            try {
                await scheduler.initializePuppeteer();
                const availableDates = await scheduler.checkMultipleMonths(4);
                
                if (availableDates.length > 0) {
                    console.log('');
                    const earliestInfo = scheduler.findEarliestAvailable(availableDates);
                    
                    if (earliestInfo.available) {
                        console.log(`✅ Earliest available: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                        console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
                        console.log(`📅 Next few dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}`);
                        
                        const data = await scheduler.loadData();
                        if (data) {
                            const weekInfo = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
                            console.log('');
                            if (weekInfo.available) {
                                console.log(`🎉 TARGET WEEK AVAILABLE! Dates: ${weekInfo.dates.join(', ')}`);
                            } else {
                                console.log(`⏳ Target week (${weekInfo.weekStart} to ${weekInfo.weekEnd}) not available yet`);
                            }
                        }
                    }
                } else {
                    console.log('❌ No available appointments found');
                    console.log('🔍 Check the debug screenshots that were created');
                }
                await scheduler.closeBrowser();
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
            break;

        case 'status':
            await scheduler.showStatus();
            break;

        case 'set-last':
            const lastDate = process.argv[3];
            if (!lastDate) {
                console.log('❌ Please provide a date (YYYY-MM-DD)');
                process.exit(1);
            }
            await scheduler.updateLastAppointment(lastDate);
            break;

        case 'set-next':
            const nextDate = process.argv[3];
            if (!nextDate) {
                console.log('❌ Please provide a date (YYYY-MM-DD)');
                process.exit(1);
            }
            await scheduler.setNextAppointment(nextDate);
            break;

        case 'debug':
            console.log('🔍 Debug mode - taking screenshots and showing page details...');
            try {
                await scheduler.initializePuppeteer();
                const availableDates = await scheduler.checkMultipleMonths(1);
                console.log(`Debug complete. Check the debug-*.png and error-*.png screenshots.`);
                await scheduler.closeBrowser();
            } catch (error) {
                console.error('❌ Debug error:', error.message);
            }
            break;

        default:
            console.log('🔧 FIXED Puppeteer-Based Hairdresser Appointment Scheduler');
            console.log('');
            console.log('🔧 This version fixes the waitForTimeout issue!');
            console.log('');
            console.log('Usage:');
            console.log('  node puppeteer-scheduler-fixed.js start       # Start monitoring');
            console.log('  node puppeteer-scheduler-fixed.js check       # Check availability once');
            console.log('  node puppeteer-scheduler-fixed.js earliest    # Find earliest available');
            console.log('  node puppeteer-scheduler-fixed.js debug       # Debug mode with screenshots');
            console.log('  node puppeteer-scheduler-fixed.js status      # Show current status');
            console.log('  node puppeteer-scheduler-fixed.js set-last <date>   # Update last appointment');
            console.log('  node puppeteer-scheduler-fixed.js set-next <date>   # Set next appointment');
            console.log('');
            console.log('🔧 Fixed Issues:');
            console.log('• ✅ waitForTimeout method compatibility');
            console.log('• ✅ Better error handling');
            console.log('• ✅ Debug screenshots');
            console.log('• ✅ More robust calendar detection');
            console.log('• ✅ Page content analysis');
            console.log('');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PuppeteerCalendlyScheduler;