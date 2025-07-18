# Hairdresser Appointment Scheduler

An automated system to monitor your hairdresser's Calendly page and notify you when appointments become available 6 weeks after your last visit.

## Features

- 📅 Tracks your last hairdresser appointment (currently set to May 30, 2025)
- 🎯 Automatically calculates target week (6 weeks later = July 7-13, 2025)
- 🔍 Monitors Calendly page hourly for any appointments in the target week
- ⚡ Shows earliest available appointment (regardless of 6-week constraint)
- 📏 Provides comprehensive availability analysis
- 📱 Provides notifications when appointments are available or unavailable
- 💾 Persistent data storage in JSON format
- 🚀 Easy command-line interface

## Setup

1. Make sure you have Node.js installed (version 14 or higher)
2. Navigate to the project directory:
   ```bash
   cd /Users/danieloostdam/Desktop/hairdresser-scheduler
   ```

## Usage

### Start Continuous Monitoring (Recommended)
```bash
node hairdresser-scheduler.js start
```
This will:
- Check availability immediately
- Continue checking every hour
- Run until you stop it (Ctrl+C)

### One-time Check
```bash
node hairdresser-scheduler.js check
```

### Check Earliest Available (Any Date)
```bash
node hairdresser-scheduler.js earliest
```
This shows the earliest appointment available regardless of the 6-week target.

### View Current Status
```bash
node hairdresser-scheduler.js status
```

### Update Last Appointment Date
```bash
node hairdresser-scheduler.js set-last 2025-05-30
```

### Set Next Appointment (when you book one)
```bash
node hairdresser-scheduler.js set-next 2025-07-11
```

## How It Works

1. **Data Storage**: Your appointment information is stored in `appointments.json`
2. **Web Scraping**: The system fetches the Calendly page and parses it for available dates
3. **Week Matching**: It looks for any appointments in your target week (6 weeks after last appointment)
4. **Notifications**: You'll see console output when:
   - ✅ Appointments become available in your target week
   - ⏳ No appointments are available in your target week (every 6 hours to avoid spam)
   - ❌ Errors occur during checking

## Current Configuration

- **Last Appointment**: May 30, 2025
- **Target Week**: July 7-13, 2025 (week containing the 6-week anniversary)
- **Target Reference Date**: July 11, 2025 (6 weeks later)
- **Calendly URL**: https://calendly.com/kapper_eric
- **Check Interval**: Every hour
- **Next Appointment**: Not currently scheduled

## Notifications

The system provides several types of notifications:

- **🎉 Available**: Appointments found in your target week (shows specific dates)
- **⏳ Not Available**: No appointments in target week (logged every 6 hours)
- **❌ Error**: Issues with checking Calendly (network problems, etc.)

## Files Created

- `appointments.json` - Stores your appointment data and notification history
- `hairdresser-scheduler.js` - Main application script
- `package.json` - Node.js project configuration
- `README.md` - This documentation

## Running in Background

### macOS/Linux (using nohup)
```bash
nohup node hairdresser-scheduler.js start > scheduler.log 2>&1 &
```

### Using screen (keeps session alive)
```bash
screen -S hairdresser
node hairdresser-scheduler.js start
# Press Ctrl+A, then D to detach
# Use 'screen -r hairdresser' to reattach
```

## Troubleshooting

### Common Issues

1. **"Command not found"**: Make sure Node.js is installed
2. **Permission denied**: Run `chmod +x hairdresser-scheduler.js`
3. **Network errors**: Check your internet connection
4. **Calendly changes**: The scraping logic may need updates if Calendly changes their page structure

### Viewing Logs
The application outputs to console. To save logs:
```bash
node hairdresser-scheduler.js start 2>&1 | tee scheduler.log
```

## Future Enhancements

- 🤖 Automatic booking capability (mentioned in requirements)
- 📧 Email notifications
- 📱 SMS notifications  
- 🔄 Multiple appointment time preferences
- 📊 Better availability analytics
- 🎨 Web interface

## Next Steps

1. **Test the system**: Run `node hairdresser-scheduler.js check` to test Calendly scraping
2. **Start monitoring**: Run `node hairdresser-scheduler.js start` to begin hourly checks
3. **Monitor results**: Check the console output and `appointments.json` for updates

## Security Note

This system scrapes a public Calendly page and doesn't store any sensitive information. All data is stored locally in JSON files.

## Ready to Use!

The system is now configured to look for appointments in the entire week of July 7-13, 2025 (rather than just a specific date), giving you better chances of finding an available slot. Start with the test script to make sure everything works, then begin continuous monitoring. The system will alert you as soon as any appointment becomes available in your target week on your hairdresser's Calendly page.