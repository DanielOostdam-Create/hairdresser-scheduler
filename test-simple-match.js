const testString = "Wednesday, October 8 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Test the simplest possible patterns
console.log('\\nTesting simple patterns:');

// 1. Just letters
const pattern1 = /([A-Za-z]+)/;
console.log('1. Just letters:', pattern1);
console.log('   Match:', testString.match(pattern1));

// 2. Letters and comma
const pattern2 = /([A-Za-z]+),/;
console.log('\\n2. Letters and comma:', pattern2);
console.log('   Match:', testString.match(pattern2));

// 3. Letters, comma, space, letters
const pattern3 = /([A-Za-z]+), ([A-Za-z]+)/;
console.log('\\n3. Two words:', pattern3);
console.log('   Match:', testString.match(pattern3));

// 4. Two words and number
const pattern4 = /([A-Za-z]+), ([A-Za-z]+) ([0-9]+)/;
console.log('\\n4. Two words and number:', pattern4);
console.log('   Match:', testString.match(pattern4));

// 5. Two words, number, and dash
const pattern5 = /([A-Za-z]+), ([A-Za-z]+) ([0-9]+) -/;
console.log('\\n5. Two words, number, and dash:', pattern5);
console.log('   Match:', testString.match(pattern5));

// 6. Full pattern with literal text
const pattern6 = /([A-Za-z]+), ([A-Za-z]+) ([0-9]+) - beschikbare tijden/;
console.log('\\n6. Full pattern:', pattern6);
console.log('   Match:', testString.match(pattern6));

if (testString.match(pattern6)) {
    console.log('✅ FINAL SUCCESS!');
}