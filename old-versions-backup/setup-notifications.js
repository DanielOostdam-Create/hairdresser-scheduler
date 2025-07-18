#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class NotificationSetup {
    constructor() {
        this.configFile = path.join(__dirname, 'notification-config.json');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async question(prompt) {
        return new Promise(resolve => {
            this.rl.question(prompt, resolve);
        });
    }

    async installDependencies() {
        console.log('📦 Installing required dependencies...');
        console.log('This may take a few minutes...\n');

        try {
            // Install nodemailer for email notifications
            console.log('📧 Installing nodemailer for email notifications...');
            execSync('npm install nodemailer', { stdio: 'inherit' });
            
            console.log('\n✅ Dependencies installed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Failed to install dependencies:', error.message);
            console.log('\n💡 You can install manually with: npm install nodemailer');
            return false;
        }
    }

    async setupEmailConfig() {
        console.log('\n📧 EMAIL NOTIFICATION SETUP');
        console.log('============================');
        
        const wantEmail = await this.question('Do you want to enable email notifications? (y/n): ');
        
        if (wantEmail.toLowerCase() !== 'y' && wantEmail.toLowerCase() !== 'yes') {
            return { enabled: false };
        }

        console.log('\nFor Gmail users:');
        console.log('1. Go to your Google Account settings');
        console.log('2. Enable 2-Step Verification');
        console.log('3. Generate an "App Password" for this application');
        console.log('4. Use the App Password below (not your regular password)\n');

        const fromEmail = await this.question('Your email address (sender): ');
        const toEmail = await this.question('Email to send notifications to: ');
        const password = await this.question('Email password or App Password: ');
        
        const isGmail = fromEmail.includes('@gmail.com');
        
        return {
            enabled: true,
            smtp: {
                host: isGmail ? 'smtp.gmail.com' : await this.question('SMTP host (e.g., smtp.gmail.com): '),
                port: isGmail ? 587 : parseInt(await this.question('SMTP port (usually 587 or 465): ')) || 587,
                secure: false,
                user: fromEmail,
                password: password
            },
            to: toEmail,
            from: fromEmail
        };
    }

    async setupPushoverConfig() {
        console.log('\n📱 PUSH NOTIFICATION SETUP (Pushover)');
        console.log('======================================');
        console.log('Pushover sends instant notifications to your phone!');
        console.log('It\'s a $5 one-time purchase and works great.\n');
        
        const wantPushover = await this.question('Do you want to enable Pushover notifications? (y/n): ');
        
        if (wantPushover.toLowerCase() !== 'y' && wantPushover.toLowerCase() !== 'yes') {
            return { enabled: false };
        }

        console.log('\nTo set up Pushover:');
        console.log('1. Download the Pushover app ($5)');
        console.log('2. Create an account at pushover.net');
        console.log('3. Get your User Key from the dashboard');
        console.log('4. Create an application to get an API Token\n');

        const userKey = await this.question('Your Pushover User Key: ');
        const apiToken = await this.question('Your Pushover API Token: ');

        return {
            enabled: true,
            userKey: userKey,
            apiToken: apiToken
        };
    }

    async saveConfig(config) {
        try {
            await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Failed to save config:', error.message);
            return false;
        }
    }

    async testNotifications(config) {
        console.log('\n🧪 Testing notifications...');
        
        try {
            const NotificationManager = require('./notification-manager');
            const notificationManager = new NotificationManager();
            
            await notificationManager.notify(
                'test',
                '🧪 Hairdresser Scheduler Test',
                'This is a test notification!\n\nIf you receive this, your notifications are working correctly.'
            );
            
            console.log('✅ Test notification sent!');
            return true;
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            return false;
        }
    }

    async runSetup() {
        console.log('🔧 HAIRDRESSER SCHEDULER NOTIFICATION SETUP');
        console.log('============================================');
        console.log('This wizard will help you set up email and push notifications.\n');

        try {
            // Step 1: Install dependencies
            await this.installDependencies();

            // Step 2: Setup email
            const emailConfig = await this.setupEmailConfig();

            // Step 3: Setup Pushover
            const pushoverConfig = await this.setupPushoverConfig();

            // Step 4: Create final config
            const config = {
                email: emailConfig,
                pushover: pushoverConfig,
                webhook: { enabled: false, url: '' }
            };

            // Step 5: Save config
            const saved = await this.saveConfig(config);
            if (!saved) {
                console.log('❌ Failed to save configuration');
                return;
            }

            console.log(`\n✅ Configuration saved to: ${this.configFile}`);

            // Step 6: Test notifications
            if (emailConfig.enabled || pushoverConfig.enabled) {
                const testNow = await this.question('\nWould you like to test the notifications now? (y/n): ');
                if (testNow.toLowerCase() === 'y' || testNow.toLowerCase() === 'yes') {
                    await this.testNotifications(config);
                }
            }

            console.log('\n🎉 SETUP COMPLETE!');
            console.log('==================');
            console.log('Your hairdresser scheduler is now ready with notifications!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Start the scheduler: node puppeteer-scheduler-notify.js start');
            console.log('2. The scheduler will check every hour for appointments');
            console.log('3. You\'ll get notifications when your target week becomes available');
            console.log('');
            console.log('Other commands:');
            console.log('• node puppeteer-scheduler-notify.js status  # Check status');
            console.log('• node puppeteer-scheduler-notify.js earliest  # Find earliest appointment');
            console.log('• node puppeteer-scheduler-notify.js test-notifications  # Test notifications again');
            console.log('');

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
        } finally {
            this.rl.close();
        }
    }
}

// Main execution
if (require.main === module) {
    const setup = new NotificationSetup();
    setup.runSetup().catch(console.error);
}

module.exports = NotificationSetup;