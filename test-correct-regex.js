const testStrings = [
    "Wednesday, October 8 - beschikbare tijden",
    "Thursday, October 9 - beschikbare tijden",
    "Tuesday, October 14 - beschikbare tijden"
];

console.log('Testing correct regex pattern:');

testStrings.forEach((str, i) => {
    console.log(`\\nTest ${i + 1}: "${str}"`);
    
    // The correct pattern should be: DayName, MonthName DayNumber - beschikbare tijden
    const correctPattern = /(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/;
    const match = str.match(correctPattern);
    
    if (match) {
        console.log(`✅ MATCH: day="${match[1]}", month="${match[2]}", date="${match[3]}"`);
        
        // Convert to date format
        const monthMap = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };
        
        const monthNum = monthMap[match[2]];
        if (monthNum) {
            const dateStr = `2025-${monthNum}-${match[3].padStart(2, '0')}`;
            console.log(`📅 Date: ${dateStr}`);
        }
    } else {
        console.log('❌ NO MATCH');
    }
});