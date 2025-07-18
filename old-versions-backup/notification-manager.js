#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class NotificationManager {
    constructor() {
        this.configFile = path.join(__dirname, 'notification-config.json');
    }

    async loadConfig() {
        try {
            const data = await fs.readFile(this.configFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return default config if file doesn't exist
            return {
                email: {
                    enabled: false,
                    smtp: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        user: '',
                        password: '' // Use app password for Gmail
                    },
                    to: '',
                    from: ''
                },
                pushover: {
                    enabled: false,
                    userKey: '',
                    apiToken: ''
                },
                webhook: {
                    enabled: false,
                    url: ''
                }
            };
        }
    }

    async saveConfig(config) {
        await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    }

    async sendEmail(subject, message, config) {
        if (!config.email.enabled) return false;

        try {
            const nodemailer = require('nodemailer');
            
            const transporter = nodemailer.createTransport({
                host: config.email.smtp.host,
                port: config.email.smtp.port,
                secure: config.email.smtp.secure,
                auth: {
                    user: config.email.smtp.user,
                    pass: config.email.smtp.password
                }
            });

            const info = await transporter.sendMail({
                from: config.email.from,
                to: config.email.to,
                subject: subject,
                text: message,
                html: `<pre>${message}</pre>`
            });

            console.log('📧 Email sent:', info.messageId);
            return true;
        } catch (error) {
            console.error('❌ Email failed:', error.message);
            return false;
        }
    }

    async sendPushover(title, message, config) {
        if (!config.pushover.enabled) return false;

        try {
            const https = require('https');
            const querystring = require('querystring');

            const postData = querystring.stringify({
                token: config.pushover.apiToken,
                user: config.pushover.userKey,
                title: title,
                message: message,
                priority: 1, // High priority
                sound: 'pushover'
            });

            const options = {
                hostname: 'api.pushover.net',
                port: 443,
                path: '/1/messages.json',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            };

            return new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        if (res.statusCode === 200) {
                            console.log('📱 Push notification sent successfully');
                            resolve(true);
                        } else {
                            console.error('❌ Push notification failed:', data);
                            resolve(false);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error('❌ Push notification error:', error.message);
                    resolve(false);
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            console.error('❌ Push notification failed:', error.message);
            return false;
        }
    }

    async sendWebhook(data, config) {
        if (!config.webhook.enabled) return false;

        try {
            const https = require('https');
            const url = require('url');

            const parsedUrl = url.parse(config.webhook.url);
            const postData = JSON.stringify(data);

            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postData.length
                }
            };

            return new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log('🔗 Webhook sent successfully');
                        resolve(true);
                    } else {
                        console.error('❌ Webhook failed with status:', res.statusCode);
                        resolve(false);
                    }
                });

                req.on('error', (error) => {
                    console.error('❌ Webhook error:', error.message);
                    resolve(false);
                });

                req.write(postData);
                req.end();
            });
        } catch (error) {
            console.error('❌ Webhook failed:', error.message);
            return false;
        }
    }

    async notify(type, title, message, data = {}) {
        const config = await this.loadConfig();
        const results = [];

        console.log(`\n🔔 Sending ${type} notification: ${title}`);

        // Send email
        if (config.email.enabled) {
            const emailResult = await this.sendEmail(title, message, config);
            results.push({ type: 'email', success: emailResult });
        }

        // Send push notification
        if (config.pushover.enabled) {
            const pushResult = await this.sendPushover(title, message, config);
            results.push({ type: 'pushover', success: pushResult });
        }

        // Send webhook
        if (config.webhook.enabled) {
            const webhookData = { type, title, message, ...data };
            const webhookResult = await this.sendWebhook(webhookData, config);
            results.push({ type: 'webhook', success: webhookResult });
        }

        // Log results
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        if (successful.length > 0) {
            console.log(`✅ Notifications sent via: ${successful.map(r => r.type).join(', ')}`);
        }
        if (failed.length > 0) {
            console.log(`❌ Failed notifications: ${failed.map(r => r.type).join(', ')}`);
        }

        return results;
    }

    async setupNotifications() {
        console.log('🔧 Notification Setup');
        console.log('=====================');
        
        const config = await this.loadConfig();
        
        console.log('\nChoose notification methods:');
        console.log('1. Email notifications');
        console.log('2. Push notifications (Pushover)');
        console.log('3. Both email and push');
        console.log('4. Webhook (advanced)');
        
        // For now, create a configuration template
        const setupInstructions = `
📧 EMAIL SETUP:
1. Install nodemailer: npm install nodemailer
2. Edit notification-config.json:
   - Set email.enabled: true
   - Add your email credentials
   - For Gmail: use App Password (not regular password)

📱 PUSHOVER SETUP (Recommended for phone alerts):
1. Download Pushover app on your phone ($5 one-time)
2. Create account at pushover.net
3. Get your User Key and create an API token
4. Edit notification-config.json:
   - Set pushover.enabled: true
   - Add userKey and apiToken

🔗 WEBHOOK SETUP (Advanced):
- Set webhook.enabled: true
- Add your webhook URL (for integrations like IFTTT, Slack, etc.)

📝 Configuration file will be created at: ${this.configFile}
`;

        console.log(setupInstructions);
        
        // Create initial config file
        await this.saveConfig(config);
        console.log(`\n✅ Configuration template created: ${this.configFile}`);
        
        return config;
    }
}

module.exports = NotificationManager;

// CLI for setup
if (require.main === module) {
    const manager = new NotificationManager();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'setup':
            manager.setupNotifications();
            break;
            
        case 'test':
            (async () => {
                console.log('🧪 Testing notifications...');
                await manager.notify(
                    'test',
                    '🧪 Test Notification',
                    'This is a test notification from your hairdresser scheduler!\n\nIf you receive this, notifications are working correctly.'
                );
            })();
            break;
            
        default:
            console.log('🔔 Notification Manager');
            console.log('Usage:');
            console.log('  node notification-manager.js setup  # Setup notifications');
            console.log('  node notification-manager.js test   # Test notifications');
            break;
    }
}
