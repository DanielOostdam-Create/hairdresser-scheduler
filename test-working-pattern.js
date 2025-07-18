const testString = "Wednesday, October 8 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Test the pattern that worked in our earlier debug - manually build it
console.log('\\nTesting different approaches:');

// 1. The exact pattern from the debug script that worked
const pattern1 = /(\\w+), (\\w+) (\\d+) - beschikbare tijden/;
console.log('1. Pattern from debug script:', pattern1);
console.log('   Match:', testString.match(pattern1));

// 2. With escaped spaces
const pattern2 = /(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
console.log('\\n2. With escaped spaces:', pattern2);
console.log('   Match:', testString.match(pattern2));

// 3. Let's manually check the spaces
console.log('\\n3. Character analysis around spaces:');
const chars = testString.split('');
chars.forEach((char, i) => {
    if (char === ' ' || char === ',' || char === '-') {
        console.log(`   ${i}: "${char}" (${char.charCodeAt(0)})`);
    }
});

// 4. Test exact string match to be sure
console.log('\\n4. Test exact string match:');
const exactMatch = testString === "Wednesday, October 8 - beschikbare tijden";
console.log('   Exact match:', exactMatch);

// 5. Let's try the most basic working pattern
console.log('\\n5. Basic working pattern:');
const basicPattern = /(\\w+), (\\w+) (\\d+) - beschikbare tijden/;
console.log('   Pattern:', basicPattern);
console.log('   Match:', testString.match(basicPattern));