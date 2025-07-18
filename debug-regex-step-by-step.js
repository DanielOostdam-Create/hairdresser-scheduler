const testString = "Wednesday, October 8 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Test step by step
console.log('\\n1. Test basic match:');
const basic = /Wednesday, October 8 - beschikbare tijden/;
console.log('Basic match:', basic.test(testString));

console.log('\\n2. Test with groups:');
const withGroups = /(Wednesday), (October) (8) - beschikbare tijden/;
const groupMatch = testString.match(withGroups);
console.log('Group match:', groupMatch);

console.log('\\n3. Test with \\\\w+:');
const wordPattern = /(\\w+), (\\w+) (\\d+) - beschikbare tijden/;
const wordMatch = testString.match(wordPattern);
console.log('Word match:', wordMatch);

console.log('\\n4. Test with \\\\s+:');
const spacePattern = /(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
const spaceMatch = testString.match(spacePattern);
console.log('Space match:', spaceMatch);

console.log('\\n5. Character analysis:');
for (let i = 0; i < 30; i++) {
    console.log(`${i}: "${testString[i]}" (${testString.charCodeAt(i)})`);
}