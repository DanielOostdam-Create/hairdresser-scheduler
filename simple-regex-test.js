const testString = "Thursday, August 14 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Test different patterns
console.log("\\n=== Testing different patterns ===");

// Pattern 1: Basic match
const pattern1 = /Thursday, August 14 - beschikbare tijden/;
console.log("Pattern 1 (exact):", pattern1.test(testString));

// Pattern 2: With groups
const pattern2 = /(\\w+), (\\w+) (\\d+) - beschikbare tijden/;
const match2 = testString.match(pattern2);
console.log("Pattern 2 (groups):", match2);

// Pattern 3: More flexible with correct escaping
const pattern3 = /(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/;
const match3 = testString.match(pattern3);
console.log("Pattern 3 (flexible):", match3);

// Pattern 4: Fixed version
const pattern4 = /([a-zA-Z]+),\\s+([a-zA-Z]+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
const match4 = testString.match(pattern4);
console.log("Pattern 4 (fixed):", match4);

// Pattern 4: Test actual structure
console.log("\\nTesting character by character:");
for (let i = 0; i < testString.length; i++) {
    console.log(`${i}: "${testString[i]}" (${testString.charCodeAt(i)})`);
}