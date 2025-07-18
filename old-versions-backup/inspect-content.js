#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function inspectActualContent() {
    console.log('🔍 Inspecting Actual Calendly Response');
    console.log('======================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching Calendly page...');
        console.log('URL:', scheduler.calendlyUrl);
        
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`📄 Response size: ${html.length} characters`);
        console.log('');
        
        console.log('📋 FULL RESPONSE CONTENT:');
        console.log('='.repeat(80));
        console.log(html);
        console.log('='.repeat(80));
        console.log('');
        
        // Check for common error indicators
        console.log('🔍 Error Analysis:');
        console.log(`Contains "error": ${html.toLowerCase().includes('error')}`);
        console.log(`Contains "404": ${html.includes('404')}`);
        console.log(`Contains "not found": ${html.toLowerCase().includes('not found')}`);
        console.log(`Contains "redirect": ${html.toLowerCase().includes('redirect')}`);
        console.log(`Contains "blocked": ${html.toLowerCase().includes('blocked')}`);
        console.log(`Contains "access denied": ${html.toLowerCase().includes('access denied')}`);
        console.log(`Contains "cloudflare": ${html.toLowerCase().includes('cloudflare')}`);
        console.log(`Contains "bot": ${html.toLowerCase().includes('bot')}`);
        console.log(`Contains "javascript": ${html.toLowerCase().includes('javascript')}`);
        console.log(`Contains "calendly": ${html.toLowerCase().includes('calendly')}`);
        console.log(`Contains HTML tags: ${html.includes('<html') || html.includes('<!DOCTYPE')}`);
        
        // Check response type
        console.log('');
        console.log('📊 Response Type Analysis:');
        if (html.includes('<!DOCTYPE html>')) {
            console.log('✅ Looks like HTML document');
        } else if (html.includes('<html')) {
            console.log('✅ Contains HTML tags');
        } else if (html.includes('HTTP/')) {
            console.log('⚠️ Looks like HTTP response headers');
        } else if (html.includes('{') && html.includes('}')) {
            console.log('⚠️ Looks like JSON response');
        } else {
            console.log('❓ Unknown response format');
        }
        
        // Check for meta redirects
        const metaRefreshMatch = html.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*>/i);
        if (metaRefreshMatch) {
            console.log('🔄 Found meta refresh redirect:', metaRefreshMatch[0]);
        }
        
        // Check for location headers or redirects
        const locationMatch = html.match(/location[:\s]*([^\r\n]+)/i);
        if (locationMatch) {
            console.log('📍 Found location redirect:', locationMatch[1]);
        }
        
    } catch (error) {
        console.error('❌ Error fetching page:', error.message);
        console.log('');
        console.log('🔧 Error details:');
        console.log('Type:', error.constructor.name);
        console.log('Code:', error.code || 'N/A');
        console.log('Syscall:', error.syscall || 'N/A');
        console.log('Host:', error.hostname || 'N/A');
        console.log('Port:', error.port || 'N/A');
    }
}

inspectActualContent();