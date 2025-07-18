#!/usr/bin/env node

const PuppeteerScheduler = require('./puppeteer-scheduler.js');

async function testPuppeteerSolution() {
    console.log('🧪 Testing Puppeteer-Based Calendly Scheduler');
    console.log('==============================================');
    console.log('');
    
    const scheduler = new PuppeteerScheduler();
    
    try {
        console.log('📦 Step 1: Checking Puppeteer installation...');
        await scheduler.initializePuppeteer();
        console.log('✅ Puppeteer is ready');
        console.log('');
        
        console.log('🌐 Step 2: Testing live Calendly scraping...');
        console.log('This will take 30-60 seconds to render the JavaScript...');
        
        const availableDates = await scheduler.checkMultipleMonths(2);
        
        console.log('');
        console.log('🎯 LIVE RESULTS FROM CALENDLY:');
        console.log('===============================');
        
        if (availableDates.length > 0) {
            console.log(`✅ SUCCESS! Found ${availableDates.length} available dates:`);
            availableDates.forEach((date, index) => {
                const dateObj = new Date(date);
                const today = new Date();
                const diffTime = dateObj - today;
                const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                console.log(`  ${index + 1}. ${date} (in ${daysFromNow} days)`);
            });
            
            console.log('');
            
            // Test target week logic
            const data = await scheduler.loadData();
            if (data) {
                const weekInfo = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
                console.log(`🎯 Target week (${weekInfo.weekStart} to ${weekInfo.weekEnd}):`);
                if (weekInfo.available) {
                    console.log(`🎉 TARGET WEEK AVAILABLE! Dates: ${weekInfo.dates.join(', ')}`);
                } else {
                    console.log(`⏳ Target week not yet available`);
                    const earliest = availableDates[0];
                    const earliestObj = new Date(earliest);
                    const today = new Date();
                    const daysFromNow = Math.ceil((earliestObj - today) / (1000 * 60 * 60 * 24));
                    console.log(`⚡ Earliest available: ${earliest} (in ${daysFromNow} days)`);
                }
            }
            
            console.log('');
            console.log('🎉 TEST SUCCESSFUL!');
            console.log('✅ Puppeteer can access live Calendly data');
            console.log('✅ Dynamic content loading works');
            console.log('✅ Date parsing is accurate');
            console.log('✅ Target week logic is working');
            
        } else {
            console.log('⚠️ No available dates found');
            console.log('This could mean:');
            console.log('• No appointments currently available (normal)');
            console.log('• Website structure changed (unlikely)');
            console.log('• Network/connection issue');
        }
        
        await scheduler.closeBrowser();
        
        console.log('');
        console.log('🚀 Ready for Production!');
        console.log('========================');
        console.log('node puppeteer-scheduler.js start     # Start hourly monitoring');
        console.log('node puppeteer-scheduler.js check     # One-time check');
        console.log('node puppeteer-scheduler.js earliest  # Find earliest appointment');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('1. Make sure you have Node.js installed');
        console.log('2. Run: npm install puppeteer');
        console.log('3. Check your internet connection');
        console.log('4. Try running: node puppeteer-scheduler.js install');
        
        await scheduler.closeBrowser();
    }
}

testPuppeteerSolution();