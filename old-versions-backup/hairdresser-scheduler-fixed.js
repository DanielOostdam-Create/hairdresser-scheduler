#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const zlib = require('zlib');

class HairdresserScheduler {
    constructor() {
        this.dataFile = path.join(__dirname, 'appointments.json');
        this.baseCalendlyUrl = 'https://calendly.com/kapper_eric/30min?back=1';
        this.checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds
        this.isRunning = false;
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

    async fetchCalendlyPage(monthParam = null) {
        const url = monthParam ? 
            `${this.baseCalendlyUrl}&month=${monthParam}` : 
            this.baseCalendlyUrl;
            
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            };

            const req = https.request(options, (res) => {
                const chunks = [];
                
                res.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const encoding = res.headers['content-encoding'];
                    
                    if (encoding === 'gzip') {
                        zlib.gunzip(buffer, (err, decoded) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(decoded.toString());
                            }
                        });
                    } else if (encoding === 'deflate') {
                        zlib.inflate(buffer, (err, decoded) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(decoded.toString());
                            }
                        });
                    } else if (encoding === 'br') {
                        zlib.brotliDecompress(buffer, (err, decoded) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(decoded.toString());
                            }
                        });
                    } else {
                        // No compression
                        resolve(buffer.toString());
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    // NEW: Improved parsing function that works with Calendly's Dutch interface
    parseAvailableDates(html, monthContext = null) {
        const dates = [];
        
        console.log(`🔍 Parsing calendar HTML for available dates (${html.length} characters)`);
        
        // Look for buttons with "beschikbare tijden" (available times) in Dutch
        const availablePattern = /aria-label="([^"]*) - beschikbare tijden"/g;
        
        let match;
        let foundCount = 0;
        
        while ((match = availablePattern.exec(html)) !== null) {
            const fullLabel = match[1];
            foundCount++;
            console.log(`  Found available date label: ${fullLabel}`);
            
            // Extract date from labels like "Friday, August 1" or "Tuesday, August 5"
            const dateMatch = fullLabel.match(/(\w+),\s+(\w+)\s+(\d{1,2})/);
            if (dateMatch) {
                const [, dayName, monthName, day] = dateMatch;
                
                // Convert month name to number (support both English and Dutch)
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
                    const year = 2025; // We know we're looking at 2025
                    const dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
                    
                    if (!dates.includes(dateStr)) {
                        dates.push(dateStr);
                        console.log(`  ✅ Parsed available date: ${dateStr} (${dayName}, ${monthName} ${day})`);
                    }
                } else {
                    console.log(`  ⚠️ Could not parse month: ${monthName}`);
                }
            } else {
                console.log(`  ⚠️ Could not parse date from: ${fullLabel}`);
            }
        }
        
        console.log(`📅 Found ${foundCount} "beschikbare tijden" labels, parsed ${dates.length} unique dates`);
        
        if (dates.length > 0) {
            console.log(`📋 Available dates: ${dates.sort().join(', ')}`);
        } else if (foundCount === 0) {
            console.log(`⚠️ No "beschikbare tijden" patterns found. This might indicate:`);
            console.log(`   • No availability in this month`);
            console.log(`   • Calendly changed their HTML structure`);
            console.log(`   • The page didn't load properly`);
            
            // Look for some diagnostic patterns
            const hasCalendly = html.toLowerCase().includes('calendly');
            const hasButtons = html.includes('<button');
            const hasAriaLabels = html.includes('aria-label');
            const hasDutch = html.includes('beschikbare') || html.includes('geen beschikbare');
            
            console.log(`   📊 Page diagnostics:`);
            console.log(`      Contains 'calendly': ${hasCalendly}`);
            console.log(`      Contains buttons: ${hasButtons}`);
            console.log(`      Contains aria-labels: ${hasAriaLabels}`);
            console.log(`      Contains Dutch text: ${hasDutch}`);
        }
        
        return dates.sort();
    }

    // NEW: Check multiple months for comprehensive availability
    async checkMultipleMonths(monthsToCheck = 3) {
        const allAvailableDates = [];
        const today = new Date();
        
        console.log(`🗓️ Checking ${monthsToCheck} months for availability...`);
        
        for (let i = 0; i < monthsToCheck; i++) {
            const checkDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthParam = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
            
            try {
                console.log(`📅 Checking ${monthParam}...`);
                const html = await this.fetchCalendlyPage(monthParam);
                const monthDates = this.parseAvailableDates(html, monthParam);
                
                if (monthDates.length > 0) {
                    console.log(`✅ ${monthParam}: Found ${monthDates.length} available dates`);
                    allAvailableDates.push(...monthDates);
                } else {
                    console.log(`❌ ${monthParam}: No available dates found`);
                }
                
                // Add small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error checking ${monthParam}: ${error.message}`);
            }
        }
        
        // Remove duplicates and sort
        const uniqueDates = [...new Set(allAvailableDates)].sort();
        
        console.log(`\n🎯 COMPREHENSIVE RESULTS:`);
        console.log(`Total unique available dates: ${uniqueDates.length}`);
        
        if (uniqueDates.length > 0) {
            console.log(`📋 All dates: ${uniqueDates.join(', ')}`);
        }
        
        return uniqueDates;
    }

    isTargetWeekAvailable(availableDates, targetDate) {
        // Calculate the target week (Monday to Sunday)
        const target = new Date(targetDate);
        const dayOfWeek = target.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Calculate Monday of the target week
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(target);
        weekStart.setDate(target.getDate() + mondayOffset);
        
        // Calculate Sunday of the target week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        // Find any available dates in the target week
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

        // Filter out dates that are in the past
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

        // Sort dates and find the earliest
        const sortedDates = futureDates.sort();
        const earliestDate = sortedDates[0];
        
        // Calculate days from now
        const todayDate = new Date(today);
        const earliest = new Date(earliestDate);
        const diffTime = earliest - todayDate;
        const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
            available: true,
            earliestDate: earliestDate,
            daysFromNow: daysFromNow,
            totalAvailable: futureDates.length,
            allDates: sortedDates.slice(0, 10) // Show first 10 dates
        };
    }

    // UPDATED: Main availability checking function
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

        // Calculate target week for display
        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`🔍 Checking availability for target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        
        try {
            // Check multiple months for comprehensive availability
            const availableDates = await this.checkMultipleMonths(3);
            
            console.log(`📅 Found ${availableDates.length} total available dates`);

            // Check both target week and earliest available
            const weekAvailability = this.isTargetWeekAvailable(availableDates, data.targetDate);
            const earliestInfo = this.findEarliestAvailable(availableDates);
            
            // Display earliest available info
            if (earliestInfo.available) {
                console.log(`⚡ Earliest available: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                if (earliestInfo.totalAvailable > 1) {
                    console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
                }
            } else {
                console.log('⚡ No future appointments currently available');
            }
            
            const now = new Date().toISOString();
            data.lastChecked = now;

            if (weekAvailability.available) {
                const datesStr = weekAvailability.dates.join(', ');
                const message = `🎉 APPOINTMENT AVAILABLE! Found ${weekAvailability.dates.length} appointment(s) in target week (${weekAvailability.weekStart} to ${weekAvailability.weekEnd}): ${datesStr}`;
                console.log(message);
                
                data.notifications.push({
                    timestamp: now,
                    type: 'available',
                    message: message,
                    targetWeek: `${weekAvailability.weekStart} to ${weekAvailability.weekEnd}`,
                    availableDates: weekAvailability.dates,
                    earliestAvailable: earliestInfo.available ? earliestInfo.earliestDate : null,
                    earliestDaysFromNow: earliestInfo.available ? earliestInfo.daysFromNow : null,
                    totalAvailable: earliestInfo.totalAvailable
                });
            } else {
                const message = `⏳ No appointments available in target week (${weekAvailability.weekStart} to ${weekAvailability.weekEnd}). Will check again in 1 hour.`;
                console.log(message);
                
                // Also show earliest available if there are any appointments
                if (earliestInfo.available) {
                    console.log(`🕰️ Note: Earliest available is ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                }
                
                // Only log "not available" notifications every 6 hours to avoid spam
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
                        totalAvailable: earliestInfo.totalAvailable
                    });
                }
            }

            await this.saveData(data);

        } catch (error) {
            console.error('❌ Error checking Calendly:', error.message);
            
            const data = await this.loadData();
            if (data) {
                data.notifications.push({
                    timestamp: new Date().toISOString(),
                    type: 'error',
                    message: `Error checking Calendly: ${error.message}`,
                    error: error.message
                });
                await this.saveData(data);
            }
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('⚠️  Scheduler is already running');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting Hairdresser Appointment Scheduler');
        
        // Calculate and display target week
        const data = await this.loadData();
        if (data) {
            const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
            console.log(`📅 Target appointment week: ${weekInfo.weekStart} to ${weekInfo.weekEnd} (6 weeks after last appointment)`);
        }
        
        console.log(`🔄 Will check every hour`);
        console.log(`🌐 Monitoring: ${this.baseCalendlyUrl}`);
        console.log('');

        // Initial check
        await this.checkAppointmentAvailability();

        // Set up hourly checking
        this.intervalId = setInterval(async () => {
            if (this.isRunning) {
                await this.checkAppointmentAvailability();
            }
        }, this.checkInterval);

        console.log('✅ Scheduler started successfully');
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('🛑 Scheduler stopped');
    }

    async updateLastAppointment(date) {
        const data = await this.loadData();
        if (data) {
            data.lastAppointment = date;
            // Calculate new target date (6 weeks later)
            const lastDate = new Date(date);
            const targetDate = new Date(lastDate);
            targetDate.setDate(lastDate.getDate() + 42); // 6 weeks = 42 days
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

        console.log('\n📊 APPOINTMENT STATUS');
        console.log('═══════════════════════════════════════');
        console.log(`Last appointment: ${data.lastAppointment}`);
        console.log(`Next appointment: ${data.nextAppointment || 'Not scheduled'}`);
        
        // Show target week instead of target date
        const weekInfo = this.isTargetWeekAvailable([], data.targetDate);
        console.log(`Target week: ${weekInfo.weekStart} to ${weekInfo.weekEnd}`);
        console.log(`Target date (reference): ${data.targetDate}`);
        
        console.log(`Last checked: ${data.lastChecked || 'Never'}`);
        console.log(`Total notifications: ${data.notifications.length}`);
        
        // Show latest earliest available info if we have any recent checks
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
    const scheduler = new HairdresserScheduler();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            await scheduler.start();
            // Keep the process running
            process.on('SIGINT', () => {
                console.log('\n🛑 Received SIGINT, stopping scheduler...');
                scheduler.stop();
                process.exit(0);
            });
            break;

        case 'check':
            await scheduler.checkAppointmentAvailability();
            break;

        case 'earliest':
            console.log('🔍 Checking earliest available appointment...');
            try {
                const availableDates = await scheduler.checkMultipleMonths(4);
                
                if (availableDates.length > 0) {
                    console.log('');
                    const earliestInfo = scheduler.findEarliestAvailable(availableDates);
                    
                    if (earliestInfo.available) {
                        console.log(`✅ Earliest available: ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                        console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
                        
                        if (earliestInfo.allDates && earliestInfo.allDates.length > 1) {
                            console.log(`📅 Next few dates: ${earliestInfo.allDates.slice(0, 5).join(', ')}`);
                        }
                        
                        // Check if target week has availability
                        const data = await scheduler.loadData();
                        if (data) {
                            const weekInfo = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
                            console.log('');
                            if (weekInfo.available) {
                                console.log(`🎉 TARGET WEEK AVAILABLE! Dates in target week: ${weekInfo.dates.join(', ')}`);
                            } else {
                                console.log(`⏳ Target week (${weekInfo.weekStart} to ${weekInfo.weekEnd}) not available yet`);
                            }
                        }
                    }
                } else {
                    console.log('❌ No available appointments found');
                }
            } catch (error) {
                console.error('❌ Error checking earliest availability:', error.message);
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

        default:
            console.log('🔧 Hairdresser Appointment Scheduler (FIXED VERSION)');
            console.log('');
            console.log('Usage:');
            console.log('  node hairdresser-scheduler-fixed.js start      # Start the hourly monitoring');
            console.log('  node hairdresser-scheduler-fixed.js check      # Check availability once');
            console.log('  node hairdresser-scheduler-fixed.js earliest   # Check earliest available appointment');
            console.log('  node hairdresser-scheduler-fixed.js status     # Show current status');
            console.log('  node hairdresser-scheduler-fixed.js set-last <date>   # Update last appointment date');
            console.log('  node hairdresser-scheduler-fixed.js set-next <date>   # Set next appointment date');
            console.log('');
            console.log('Examples:');
            console.log('  node hairdresser-scheduler-fixed.js check');
            console.log('  node hairdresser-scheduler-fixed.js earliest   # See what\'s available now');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = HairdresserScheduler;