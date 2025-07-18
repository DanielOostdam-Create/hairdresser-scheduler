const testString = "Wednesday, October 8 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Test with explicit character classes instead of \\w
console.log('\\nUsing explicit character classes:');

// 1. Basic character class
const pattern1 = /([A-Za-z]+), ([A-Za-z]+) (\\d+) - beschikbare tijden/;
console.log('1. Basic character class:', pattern1);
const match1 = testString.match(pattern1);
console.log('   Match:', match1);

if (match1) {
    console.log('✅ SUCCESS!');
    console.log(`   Day: "${match1[1]}"`);
    console.log(`   Month: "${match1[2]}"`);
    console.log(`   Date: "${match1[3]}"`);
    
    // Convert to date format
    const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const monthNum = monthMap[match1[2]];
    if (monthNum) {
        const dateStr = `2025-${monthNum}-${match1[3].padStart(2, '0')}`;
        console.log(`   📅 Final date: ${dateStr}`);
    }
}

// 2. With spaces as explicit
const pattern2 = /([A-Za-z]+),\\s+([A-Za-z]+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
console.log('\\n2. With explicit spaces:', pattern2);
const match2 = testString.match(pattern2);
console.log('   Match:', match2);

if (match2) {
    console.log('✅ SUCCESS with spaces!');
    console.log(`   Day: "${match2[1]}"`);
    console.log(`   Month: "${match2[2]}"`);
    console.log(`   Date: "${match2[3]}"`);
}