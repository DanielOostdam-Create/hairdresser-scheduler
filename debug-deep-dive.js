#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function deepDiveDebug() {
    const browser = await puppeteer.launch({
        headless: false, // Show browser
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        console.log('📅 Loading September 2025...');
        await page.goto('https://calendly.com/kapper_eric/30min?back=1&month=2025-09');
        
        console.log('⏳ Waiting for calendar...');
        await page.waitForSelector('[data-testid="calendar"]', { timeout: 30000 });
        
        console.log('⏳ Waiting for content...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        console.log('📸 Taking screenshot...');
        await page.screenshot({ path: 'debug-live.png', fullPage: true });
        
        console.log('🔍 Analyzing ALL buttons...');
        const buttonAnalysis = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            const results = [];
            
            buttons.forEach((button, index) => {
                const ariaLabel = button.getAttribute('aria-label');
                const textContent = button.textContent?.trim();
                
                if (ariaLabel && (
                    ariaLabel.includes('30') || 
                    ariaLabel.includes('September') || 
                    ariaLabel.includes('beschikbare') ||
                    ariaLabel.includes('available')
                )) {
                    results.push({
                        index,
                        ariaLabel,
                        textContent,
                        hasClass: button.className,
                        parent: button.parentElement?.tagName
                    });
                }
            });
            
            return results;
        });
        
        console.log('\\n🎯 Relevant buttons found:');
        buttonAnalysis.forEach((btn, i) => {
            console.log(`${i + 1}. Text: "${btn.textContent}"`);
            console.log(`   Aria: "${btn.ariaLabel}"`);
            console.log(`   Class: "${btn.hasClass}"`);
            console.log('');
        });
        
        // Wait for user to see the page
        console.log('\\n⏳ Waiting 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

deepDiveDebug().catch(console.error);