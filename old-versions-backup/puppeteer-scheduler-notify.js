#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const NotificationManager = require('./notification-manager');

class PuppeteerCalendlyScheduler {
    constructor() {
        this.dataFile = path.join(__dirname, 'appointments.json');
        this.calendlyUrl = 'https://calendly.com/kapper_eric/30min?back=1';
        this.checkInterval = 60 * 60 * 1000; // 1 hour
        this.isRunning = false;
        this.puppeteer = null;
        this.browser = null;
        this.notificationManager = new NotificationManager();
    }

    // Custom delay method that works with all Puppeteer versions
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                    '--disable-gpu'
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
            
            // Navigate to page
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Wait for calendar to load
            console.log('⏳ Waiting for calendar to load...');
            await page.waitForSelector('[data-testid="calendar"]', { timeout: 20000 });
            
            // Additional wait to ensure all dynamic content loads
            console.log('⏳ Waiting for dynamic content...');
            await this.delay(3000);
            
            // Extract available dates
            console.log('🔍 Extracting available dates...');
            const availableDates = await page.evaluate(() => {
                const dates = [];
                
                // Look for buttons with "beschikbare tijden" (available times)
                const buttons = document.querySelectorAll('button[aria-label*="beschikbare tijden"]');
                
                buttons.forEach(button => {
                    const ariaLabel = button.getAttribute('aria-label');
                    if (ariaLabel) {
                        console.log('Found available date:', ariaLabel);
                        
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
                            }
                        }
                    }
                });
                
                return [...new Set(dates)].sort();
            });
            
            console.log(`✅ Found ${availableDates.length} available dates in ${monthParam}`);
            if (availableDates.length > 0) {
                console.log(`📋 Dates: ${availableDates.join(', ')}`);
            }
            
            return availableDates;
            
        } catch (error) {
            console.error(`❌ Error scraping ${monthOffset ? 'month +' + monthOffset : 'current month'}:`, error.message);
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
                await this.delay(2000);
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
                
                // SEND NOTIFICATION! 🔔
                const notificationTitle = '🎉 Hairdresser Appointment Available!';
                const notificationMessage = `TARGET WEEK AVAILABLE!

📅 Dates: ${datesStr}
📆 Week: ${weekAvailability.weekStart} to ${weekAvailability.weekEnd}
⚡ Earliest: ${earliestInfo.available ? earliestInfo.earliestDate : 'N/A'}
📊 Total available: ${earliestInfo.totalAvailable}

🌐 Book now: https://calendly.com/kapper_eric/30min

Time checked: ${new Date().toLocaleString()}`;

                await this.notificationManager.notify(
                    'appointment_available',
                    notificationTitle,
                    notificationMessage,
                    {
                        targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                        availableDates: weekAvailability.dates,
                        earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                        totalAvailable: earliestInfo.totalAvailable,
                        calendlyUrl: this.calendlyUrl
                    }
                );
                
                data.notifications.push({
                    timestamp: now,
                    type: 'available',
                    message: message,
                    targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                    availableDates: weekAvailability.dates,
                    earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                    earliestDaysFromNow: earliestInfo.available ? earliestInfo.daysFromNow : null,
                    totalAvailable: earliestInfo.totalAvailable,
                    scrapingMethod: 'puppeteer',
                    notificationSent: true
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
                        scrapingMethod: 'puppeteer'
                    });
                }
            }

            await this.saveData(data);

        } catch (error) {
            console.error('❌ Error checking Calendly with Puppeteer:', error.message);
            
            // Send error notification
            await this.notificationManager.notify(
                'error',
                '⚠️ Hairdresser Scheduler Error',
                `Error occurred while checking appointments:

❌ Error: ${error.message}
🕐 Time: ${new Date().toLocaleString()}

The scheduler will continue trying on the next hourly check.`
            );
            
            const data = await this.loadData();
            if (data) {
                data.notifications.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: `Puppeteer error: ${error.message}`,
                    error: error.message,
                    scrapingMethod: 'puppeteer'
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
        console.log('🚀 Starting Puppeteer-Based Hairdresser Appointment Scheduler');
        console.log('🌟 This version uses browser automation to get LIVE calendar data!');
        console.log('🔔 Notifications enabled - you\'ll be alerted when appointments are available!');
        
        const data = await this.loadData();
        if (data) {
            const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
            console.log(`📅 Target appointment week: ${weekInfo.weekStart} to ${weekInfo.weekEnd} (6 weeks after last appointment)`);
        }
        
        console.log(`🔄 Will check every hour using Puppeteer`);
        console.log(`🌐 Monitoring: ${this.calendlyUrl}`);
        console.log('');

        // Send startup notification
        await this.notificationManager.notify(
            'startup',
            '🚀 Hairdresser Scheduler Started',
            `The hairdresser appointment scheduler has started!

🎯 Target week: ${data ? this.isTargetWeekAvailable([], data.targetDate).weekStart + ' to ' + this.isTargetWeekAvailable([], data.targetDate).weekEnd : 'Loading...'}
🔄 Check frequency: Every hour
🌐 Monitoring: https://calendly.com/kapper_eric/30min

You'll receive notifications when appointments become available!

Started: ${new Date().toLocaleString()}`
        );

        // Initial check
        await this.checkAppointmentAvailability();

        // Set up hourly checking
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                console.log(`\n⏰ ${new Date().toLocaleString()} - Running hourly check...`);
                await this.checkAppointmentAvailability();
            }
        }, this.checkInterval);

        console.log('✅ Puppeteer scheduler started successfully');
        console.log('📱 You will receive notifications when appointments are available!');
        
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
        console.log('🛑 Puppeteer scheduler stopped');
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
            
            // Send confirmation notification
            await this.notificationManager.notify(
                'appointment_set',
                '✅ Appointment Scheduled',
                `Great! Your next hairdresser appointment has been set.

📅 Date: ${date}
🎯 The scheduler will now look for the next appointment 6 weeks later.

Updated: ${new Date().toLocaleString()}`
            );
        }
    }

    async showStatus() {
        const data = await this.loadData();
        if (!data) {
            console.log('❌ Could not load appointment data');
            return;
        }

        console.log('\n📊 PUPPETEER APPOINTMENT STATUS');
        console.log('═══════════════════════════════════════════');
        console.log(`Last appointment: ${data.lastAppointment}`);
        console.log(`Next appointment: ${data.nextAppointment || 'Not scheduled'}`);
        
        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`Target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        console.log(`Target date (reference): ${data.targetDate}`);
        
        console.log(`Last checked: ${data.lastChecked || 'Never'}`);
        console.log(`Total notifications: ${data.notifications.length}`);
        console.log(`Scraping method: Browser automation (Puppeteer)`);
        console.log(`🔔 Notifications: Enabled`);
        
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
                const sent = notification.notificationSent ? ' ✅' : '';
                console.log(`  ${time}: ${notification.message}${sent}`);
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
            console.log('🔍 Checking availability with Puppeteer...');
            await scheduler.checkAppointmentAvailability();
            await scheduler.closeBrowser();
            break;

        case 'earliest':
            console.log('🔍 Finding earliest available appointment with Puppeteer...');
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

        case 'install':
            console.log('📦 Installing Puppeteer...');
            await scheduler.installPuppeteer();
            console.log('✅ Installation complete! You can now run the scheduler.');
            break;

        case 'notifications':
            await scheduler.notificationManager.setupNotifications();
            break;

        case 'test-notifications':
            await scheduler.notificationManager.notify(
                'test',
                '🧪 Test Notification',
                'This is a test notification from your hairdresser scheduler!\n\nIf you receive this, notifications are working correctly.'
            );
            break;

        default:
            console.log('🔧 Puppeteer-Based Hairdresser Appointment Scheduler');
            console.log('');
            console.log('🌟 This version uses browser automation to get LIVE calendar data!');
            console.log('🔔 Now with Email & Push Notifications!');
            console.log('');
            console.log('First-time setup:');
            console.log('  node puppeteer-scheduler-notify.js install        # Install Puppeteer');
            console.log('  node puppeteer-scheduler-notify.js notifications  # Setup notifications');
            console.log('');
            console.log('Usage:');
            console.log('  node puppeteer-scheduler-notify.js start          # Start monitoring with notifications');
            console.log('  node puppeteer-scheduler-notify.js check          # Check availability once');
            console.log('  node puppeteer-scheduler-notify.js earliest       # Find earliest available');
            console.log('  node puppeteer-scheduler-notify.js status         # Show current status');
            console.log('  node puppeteer-scheduler-notify.js test-notifications  # Test notifications');
            console.log('  node puppeteer-scheduler-notify.js set-last <date>     # Update last appointment');
            console.log('  node puppeteer-scheduler-notify.js set-next <date>     # Set next appointment');
            console.log('');
            console.log('✅ Features:');
            console.log('• Gets LIVE data from Calendly (JavaScript rendered)');
            console.log('• Works with dynamic content loading');
            console.log('• Accurate real-time availability');
            console.log('• Handles all Dutch/English date formats');
            console.log('• 📧 Email notifications');
            console.log('• 📱 Push notifications (Pushover)');
            console.log('• 🔄 Hourly monitoring');
            console.log('• 🎯 Target week detection');
            console.log('');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PuppeteerCalendlyScheduler;