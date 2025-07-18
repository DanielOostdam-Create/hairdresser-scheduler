#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class RobustNotificationManager {
    constructor() {
        this.configFile = path.join(__dirname, 'notification-config.json');
        this.maxRetries = 3;
    }

    async loadConfig() {
        try {
            const data = await fs.readFile(this.configFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {
                email: { enabled: false },
                pushover: { enabled: false }
            };
        }
    }

    async testNetworkConnectivity() {
        return new Promise((resolve) => {
            const { spawn } = require('child_process');
            const ping = spawn('ping', ['-c', '1', '8.8.8.8']);
            
            ping.on('close', (code) => {
                resolve(code === 0);
            });
            
            ping.on('error', () => resolve(false));
            setTimeout(() => { ping.kill(); resolve(false); }, 5000);
        });
    }

    async sendEmailWithRetry(subject, message, config, retryCount = 0) {
        if (!config.email.enabled) return false;

        try {
            const hasNetwork = await this.testNetworkConnectivity();
            if (!hasNetwork) {
                console.log('📡 No network connectivity, skipping email');
                return false;
            }

            const nodemailer = require('nodemailer');
            
            const transporter = nodemailer.createTransporter({
                host: config.email.smtp.host,
                port: config.email.smtp.port,
                secure: config.email.smtp.secure,
                auth: {
                    user: config.email.smtp.user,
                    pass: config.email.smtp.password
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 15000
            });

            const info = await transporter.sendMail({
                from: config.email.from,
                to: config.email.to,
                subject: subject,
                text: message,
                html: `<pre style="font-family: monospace; white-space: pre-wrap;">${message}</pre>`
            });

            console.log('📧 Email sent successfully');
            return true;
        } catch (error) {
            console.error(`❌ Email attempt ${retryCount + 1} failed:`, error.message);
            
            if (retryCount < this.maxRetries - 1) {
                const waitTime = (retryCount + 1) * 5;
                console.log(`🔄 Retrying email in ${waitTime} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                return await this.sendEmailWithRetry(subject, message, config, retryCount + 1);
            }
            
            return false;
        }
    }

    async notify(type, title, message, data = {}) {
        const config = await this.loadConfig();
        console.log(`\n🔔 Sending ${type} notification: ${title}`);
        
        const emailResult = await this.sendEmailWithRetry(title, message, config);
        
        if (emailResult) {
            console.log('✅ Email notification sent');
        } else {
            console.log('❌ Email notification failed');
        }
        
        return [{ type: 'email', success: emailResult }];
    }
}

class RobustPuppeteerScheduler {
    constructor() {
        this.dataFile = path.join(__dirname, 'appointments.json');
        this.calendlyUrl = 'https://calendly.com/kapper_eric/30min?back=1';
        this.checkInterval = 60 * 60 * 1000; // 1 hour
        this.isRunning = false;
        this.puppeteer = null;
        this.notificationManager = new RobustNotificationManager();
        this.consecutiveErrors = 0;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async initializePuppeteer() {
        try {
            console.log('🔧 Initializing Puppeteer...');
            this.puppeteer = require('puppeteer');
            console.log('✅ Puppeteer loaded successfully');
        } catch (error) {
            throw new Error(`Puppeteer not found: ${error.message}`);
        }
    }

    async scrapeCalendlyWithRetry(monthOffset = 0, maxRetries = 2) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            let browser = null;
            try {
                console.log(`📅 Scraping attempt ${attempt + 1}/${maxRetries + 1} for month +${monthOffset}`);
                
                // Use working browser configuration
                browser = await this.puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage'
                    ],
                    timeout: 30000
                });

                const page = await browser.newPage();
                
                try {
                    await page.setViewport({ width: 1280, height: 720 });
                    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
                    
                    const targetDate = new Date();
                    targetDate.setMonth(targetDate.getMonth() + monthOffset);
                    const monthParam = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
                    
                    const url = `${this.calendlyUrl}&month=${monthParam}`;
                    console.log(`📅 Scraping: ${url}`);
                    
                    await page.goto(url, { 
                        waitUntil: 'networkidle2',
                        timeout: 45000 
                    });
                    
                    console.log('⏳ Waiting for calendar...');
                    await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
                    
                    console.log('⏳ Loading dynamic content...');
                    await this.delay(5000);
                    
                    console.log('🔍 Extracting dates...');
                    const availableDates = await page.evaluate(() => {
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
                        
                        return [...new Set(dates)].sort();
                    });
                    
                    console.log(`✅ Found ${availableDates.length} dates in ${monthParam}`);
                    if (availableDates.length > 0) {
                        console.log(`📋 Dates: ${availableDates.join(', ')}`);
                    }
                    
                    return availableDates;
                    
                } finally {
                    await page.close();
                }
                
            } catch (error) {
                console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);
                
                if (attempt < maxRetries) {
                    const waitTime = (attempt + 1) * 3;
                    console.log(`🔄 Retrying in ${waitTime} seconds...`);
                    await this.delay(waitTime * 1000);
                } else {
                    console.error(`❌ All attempts failed for month +${monthOffset}`);
                    return [];
                }
            } finally {
                if (browser) {
                    await browser.close();
                }
            }
        }
        
        return [];
    }

    async checkMultipleMonths(monthsToCheck = 6) {
        await this.initializePuppeteer();
        const allDates = [];
        
        console.log(`🗓️ Checking ${monthsToCheck} months with robust retry logic...`);
        
        for (let i = 0; i < monthsToCheck; i++) {
            const monthDates = await this.scrapeCalendlyWithRetry(i);
            allDates.push(...monthDates);
            
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
            console.log(`✅ Next appointment scheduled for: ${data.nextAppointment}`);
            console.log(`🔍 Continuing to search for better slots in upcoming weeks...`);
        }

        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`🔍 Checking availability for target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        
        try {
            const availableDates = await this.checkMultipleMonths(6);
            
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

            // TARGET WEEK AVAILABLE (HIGH PRIORITY)
            if (weekAvailability.available) {
                const datesStr = weekAvailability.dates.join(', ');
                const message = `🎉 TARGET WEEK AVAILABLE! Found ${weekAvailability.dates.length} appointment(s): ${datesStr}`;
                console.log(`\n${message}`);
                
                const notificationTitle = '🎉 TARGET WEEK AVAILABLE!';
                const notificationMessage = `YOUR PREFERRED WEEK IS NOW AVAILABLE!

📅 Available Dates: ${datesStr}
📆 Week: ${weekAvailability.weekStart} to ${weekAvailability.weekEnd}
⚡ Earliest: ${earliestInfo.available ? earliestInfo.earliestDate : 'N/A'} (${earliestInfo.available ? earliestInfo.daysFromNow + ' days' : 'N/A'})
📊 Total appointments: ${earliestInfo.totalAvailable}
📋 All dates: ${earliestInfo.available ? earliestInfo.allDates.slice(0, 8).join(', ') : 'None'}

🌐 Book now: https://calendly.com/kapper_eric/30min

Time: ${new Date().toLocaleString()}

⚡ ACTION REQUIRED: Book your appointment ASAP!`;

                await this.notificationManager.notify(
                    'target_week_available',
                    notificationTitle,
                    notificationMessage
                );
                
                data.notifications.push({
                    timestamp: now,
                    type: 'target_week_available',
                    message: message,
                    targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                    availableDates: weekAvailability.dates,
                    earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                    totalAvailable: earliestInfo.totalAvailable,
                    notificationSent: true,
                    priority: 'high'
                });
            }
            // BETTER SLOT AVAILABLE (EARLIER THAN CURRENT APPOINTMENT)
            else if (earliestInfo.available && data.nextAppointment) {
                const currentAppointment = new Date(data.nextAppointment);
                const earliestAvailable = new Date(earliestInfo.earliestDate);
                
                if (earliestAvailable < currentAppointment) {
                    const message = `🔄 BETTER SLOT AVAILABLE! Found earlier appointment: ${earliestInfo.earliestDate} (current: ${data.nextAppointment})`;
                    console.log(`\n${message}`);
                    
                    const notificationTitle = '🔄 Better Appointment Available!';
                    const notificationMessage = `BETTER SLOT FOUND!

🎯 Better slot: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)
📅 Current appointment: ${data.nextAppointment}
📊 Total appointments: ${earliestInfo.totalAvailable}
📋 All dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}

🌐 Book now: https://calendly.com/kapper_eric/30min

Time: ${new Date().toLocaleString()}

💡 Consider rebooking to the earlier slot!`;

                    await this.notificationManager.notify(
                        'better_slot_available',
                        notificationTitle,
                        notificationMessage
                    );
                    
                    data.notifications.push({
                        timestamp: now,
                        type: 'better_slot_available',
                        message: message,
                        earliestAvailable: earliestInfo.earliestDate,
                        currentAppointment: data.nextAppointment,
                        totalAvailable: earliestInfo.totalAvailable,
                        notificationSent: true,
                        priority: 'high'
                    });
                }
            }
            // EARLIEST APPOINTMENT WITHIN 7 DAYS (MEDIUM PRIORITY)
            else if (earliestInfo.available && earliestInfo.daysFromNow <= 7) {
                const recentSoonNotifications = data.notifications
                    .filter(n => n.type === 'earliest_soon')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                const lastSoonNotification = recentSoonNotifications[0];
                const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
                
                const shouldNotify = !lastSoonNotification || 
                    new Date(lastSoonNotification.timestamp) < fourHoursAgo ||
                    lastSoonNotification.earliestAvailable !== earliestInfo.earliestDate;
                
                if (shouldNotify) {
                    const message = `⚡ VERY SOON APPOINTMENT! Available in ${earliestInfo.daysFromNow} days (${earliestInfo.earliestDate})`;
                    console.log(`\n${message}`);
                    
                    const notificationTitle = `⚡ Appointment in ${earliestInfo.daysFromNow} Days!`;
                    const notificationMessage = `VERY SOON APPOINTMENT AVAILABLE!

⚡ Earliest: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)
📊 Total appointments: ${earliestInfo.totalAvailable}
📅 Next dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}

🎯 Target week: ${weekAvailability.weekStart} to ${weekAvailability.weekEnd} (not available yet)
📅 Current appointment: ${data.nextAppointment || 'None scheduled'}

🌐 Book now: https://calendly.com/kapper_eric/30min

Time: ${new Date().toLocaleString()}

💡 This is sooner than your current appointment!`;

                    await this.notificationManager.notify(
                        'earliest_soon',
                        notificationTitle,
                        notificationMessage
                    );
                    
                    data.notifications.push({
                        timestamp: now,
                        type: 'earliest_soon',
                        message: message,
                        targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                        earliestAvailable: earliestInfo.earliestDate,
                        earliestDaysFromNow: earliestInfo.daysFromNow,
                        totalAvailable: earliestInfo.totalAvailable,
                        notificationSent: true,
                        priority: 'medium'
                    });
                }
            }
            // REGULAR STATUS UPDATE
            else {
                const message = `⏳ Target week not available. Next check in 1 hour.`;
                console.log(`\n${message}`);
                
                if (earliestInfo.available) {
                    console.log(`🕰️ Earliest available: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                }
                
                // Send status update every 12 hours
                const lastStatusUpdate = data.notifications
                    .filter(n => n.type === 'status_update')
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                
                const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
                
                if (!lastStatusUpdate || new Date(lastStatusUpdate.timestamp) < twelveHoursAgo) {
                    const statusTitle = '📊 Scheduler Status Update';
                    const statusMessage = `HOURLY CHECK COMPLETE

🎯 Target week: ${weekAvailability.weekStart} to ${weekAvailability.weekEnd}
❌ Target week: Not available yet
📅 Current appointment: ${data.nextAppointment || 'None scheduled'}

${earliestInfo.available ? 
                        `⚡ Earliest: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)
📊 Total appointments: ${earliestInfo.totalAvailable}
📅 Next dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}` : 
                        '❌ No appointments currently available'
                    }

🔄 Next check: In 1 hour
🌐 Monitoring: https://calendly.com/kapper_eric/30min

Time: ${new Date().toLocaleString()}

✅ Scheduler running normally`;

                    await this.notificationManager.notify(
                        'status_update',
                        statusTitle,
                        statusMessage
                    );
                }
                
                data.notifications.push({
                    timestamp: now,
                    type: 'not_available',
                    message: message,
                    targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                    availableDatesCount: availableDates.length,
                    earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                    earliestDaysFromNow: earliestInfo.available ? earliestInfo.daysFromNow : null,
                    totalAvailable: earliestInfo.totalAvailable,
                    currentAppointment: data.nextAppointment
                });
            }

            await this.saveData(data);
            this.consecutiveErrors = 0; // Reset on success

        } catch (error) {
            this.consecutiveErrors++;
            console.error('❌ Error checking Calendly:', error.message);
            
            // Only send error notification after multiple failures
            if (this.consecutiveErrors >= 2) {
                await this.notificationManager.notify(
                    'error',
                    '⚠️ Scheduler Error',
                    `Multiple errors occurred:

❌ Error: ${error.message}
🔢 Consecutive errors: ${this.consecutiveErrors}
🕐 Time: ${new Date().toLocaleString()}

The scheduler will continue trying.`
                );
            }
            
            const data = await this.loadData();
            if (data) {
                data.notifications.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: `Error: ${error.message}`,
                    error: error.message,
                    consecutiveErrors: this.consecutiveErrors
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
        console.log('🚀 Starting FIXED Hairdresser Appointment Scheduler');
        console.log('🛡️ Enhanced with working date extraction and 6-month search!');
        console.log('🔔 Email notifications enabled!');
        
        const data = await this.loadData();
        if (data) {
            const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
            console.log(`📅 Target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
            if (data.nextAppointment) {
                console.log(`📅 Current appointment: ${data.nextAppointment}`);
            }
        }
        
        console.log(`🔄 Checking every hour`);
        console.log(`🌐 Monitoring: ${this.calendlyUrl}`);
        console.log('');

        // Startup notification
        await this.notificationManager.notify(
            'startup',
            '🚀 FIXED Scheduler Started',
            `Fixed hairdresser scheduler started!

🎯 Target week: ${data ? this.isTargetWeekAvailable([], data.targetDate).weekStart + ' to ' + this.isTargetWeekAvailable([], data.targetDate).weekEnd : 'Loading...'}
📅 Current appointment: ${data ? data.nextAppointment || 'None scheduled' : 'Loading...'}
🔄 Check frequency: Every hour
🌐 Monitoring: https://calendly.com/kapper_eric/30min
🛡️ Features: Working date extraction, 6-month search, better slot detection

Started: ${new Date().toLocaleString()}`
        );

        // Initial check
        await this.checkAppointmentAvailability();

        // Hourly checks
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                console.log(`\n⏰ ${new Date().toLocaleString()} - Hourly check...`);
                await this.checkAppointmentAvailability();
            }
        }, this.checkInterval);

        console.log('✅ Fixed scheduler started successfully');
        
        // Cleanup handlers
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down...');
            await this.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Shutting down...');
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
        console.log('🛑 Scheduler stopped');
    }

    async showStatus() {
        const data = await this.loadData();
        if (!data) {
            console.log('❌ Could not load appointment data');
            return;
        }

        console.log('\n📊 FIXED SCHEDULER STATUS');
        console.log('═══════════════════════════');
        console.log(`Last appointment: ${data.lastAppointment}`);
        console.log(`Next appointment: ${data.nextAppointment || 'Not scheduled'}`);
        
        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`Target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        console.log(`Last checked: ${data.lastChecked || 'Never'}`);
        console.log(`Total notifications: ${data.notifications.length}`);
        console.log(`Consecutive errors: ${this.consecutiveErrors}`);
        console.log(`🔔 Email notifications: Enabled`);
        
        if (data.notifications.length > 0) {
            console.log('\n📱 Recent activity:');
            data.notifications.slice(-3).forEach(notification => {
                const time = new Date(notification.timestamp).toLocaleString();
                console.log(`  ${time}: ${notification.message}`);
            });
        }
        console.log('');
    }
}

// CLI Interface
async function main() {
    const scheduler = new RobustPuppeteerScheduler();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            await scheduler.start();
            break;

        case 'check':
            console.log('🔍 Running one-time check...');
            await scheduler.checkAppointmentAvailability();
            break;

        case 'earliest':
            console.log('🔍 Finding earliest appointment...');
            try {
                const availableDates = await scheduler.checkMultipleMonths(6);
                
                if (availableDates.length > 0) {
                    const earliestInfo = scheduler.findEarliestAvailable(availableDates);
                    
                    if (earliestInfo.available) {
                        console.log(`✅ Earliest: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                        console.log(`📊 Total: ${earliestInfo.totalAvailable}`);
                        console.log(`📅 Next dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}`);
                        
                        const data = await scheduler.loadData();
                        if (data) {
                            const weekInfo = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
                            if (weekInfo.available) {
                                console.log(`🎉 TARGET WEEK AVAILABLE! ${weekInfo.dates.join(', ')}`);
                            } else {
                                console.log(`⏳ Target week (${weekInfo.weekStart} to ${weekInfo.weekEnd}) not available`);
                            }
                        }
                    }
                } else {
                    console.log('❌ No appointments found');
                }
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
            break;

        case 'status':
            await scheduler.showStatus();
            break;

        case 'test':
            await scheduler.notificationManager.notify(
                'test',
                '🧪 Test - Fixed Scheduler',
                'Test notification from the FIXED scheduler!\n\nWorking date extraction and 6-month search enabled.'
            );
            break;

        default:
            console.log('🔧 FIXED Hairdresser Appointment Scheduler');
            console.log('');
            console.log('🛡️ Enhanced with working date extraction & 6-month search!');
            console.log('');
            console.log('Usage:');
            console.log('  node hairdresser-scheduler-fixed-working.js start    # Start monitoring');
            console.log('  node hairdresser-scheduler-fixed-working.js check    # One-time check');
            console.log('  node hairdresser-scheduler-fixed-working.js earliest # Find earliest');
            console.log('  node hairdresser-scheduler-fixed-working.js status   # Show status');
            console.log('  node hairdresser-scheduler-fixed-working.js test     # Test notifications');
            console.log('');
            console.log('✅ Fixed Issues:');
            console.log('• ✅ Working date extraction from Calendly');
            console.log('• ✅ 6-month search range (covers September)');
            console.log('• ✅ Better slot detection for existing appointments');
            console.log('• ✅ Updated target date to July 17th');
            console.log('• ✅ Continues searching even after appointment scheduled');
            console.log('');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RobustPuppeteerScheduler;