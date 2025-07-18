#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function showActualContent() {
    console.log('🔍 Showing Actual Calendly Response Content');
    console.log('===========================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching:', scheduler.calendlyUrl);
        
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`📄 Response size: ${html.length} characters`);
        console.log('');
        
        console.log('📋 ACTUAL RESPONSE CONTENT:');
        console.log('='.repeat(80));
        console.log(html);
        console.log('='.repeat(80));
        console.log('');
        
        // Analyze what we got
        console.log('🔍 Response Analysis:');
        console.log(`Is HTML: ${html.includes('<html') || html.includes('<!DOCTYPE')}`);
        console.log(`Contains JavaScript: ${html.includes('<script')}`);
        console.log(`Contains Error: ${html.toLowerCase().includes('error')}`);
        console.log(`Contains 404: ${html.includes('404')}`);
        console.log(`Contains Blocked: ${html.toLowerCase().includes('block')}`);
        console.log(`Contains Cloudflare: ${html.toLowerCase().includes('cloudflare')}`);
        console.log(`Contains Access Denied: ${html.toLowerCase().includes('access denied')}`);
        console.log(`Contains Bot Detection: ${html.toLowerCase().includes('bot') || html.toLowerCase().includes('automated')}`);
        console.log(`Contains Redirect: ${html.toLowerCase().includes('redirect')}`);
        console.log(`Title tag: ${html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 'Not found'}`);
        
    } catch (error) {
        console.error('❌ Network Error:', error.message);
        console.log('Error details:', error);
    }
}

showActualContent();