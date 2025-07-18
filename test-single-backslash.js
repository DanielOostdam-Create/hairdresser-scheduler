const testString = "Wednesday, October 8 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Test with single backslashes (correct)
const correctPattern = /(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/;
const match = testString.match(correctPattern);

console.log('Pattern:', correctPattern);
console.log('Match:', match);

if (match) {
    console.log('✅ SUCCESS!');
    console.log(`Day: "${match[1]}"`);
    console.log(`Month: "${match[2]}"`);
    console.log(`Date: "${match[3]}"`);
    
    // Convert to date format
    const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const monthNum = monthMap[match[2]];
    if (monthNum) {
        const dateStr = `2025-${monthNum}-${match[3].padStart(2, '0')}`;
        console.log(`📅 Final date: ${dateStr}`);
    }
} else {
    console.log('❌ No match');
}