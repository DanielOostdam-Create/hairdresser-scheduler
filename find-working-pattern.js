const testString = "Wednesday, October 8 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// Let's build the pattern step by step
console.log('\\nBuilding pattern step by step:');

// Step 1: Just the word
console.log('1. Just word:');
const step1 = /(\\w+)/;
console.log('   Pattern:', step1);
console.log('   Match:', testString.match(step1));

// Step 2: Word + comma + space
console.log('\\n2. Word + comma + space:');
const step2 = /(\\w+),\\s+/;
console.log('   Pattern:', step2);
console.log('   Match:', testString.match(step2));

// Step 3: Two words
console.log('\\n3. Two words:');
const step3 = /(\\w+),\\s+(\\w+)/;
console.log('   Pattern:', step3);
console.log('   Match:', testString.match(step3));

// Step 4: Two words + space + number
console.log('\\n4. Two words + space + number:');
const step4 = /(\\w+),\\s+(\\w+)\\s+(\\d+)/;
console.log('   Pattern:', step4);
console.log('   Match:', testString.match(step4));

// Step 5: Full pattern
console.log('\\n5. Full pattern:');
const step5 = /(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
console.log('   Pattern:', step5);
console.log('   Match:', testString.match(step5));

// Alternative: Try without the word boundaries
console.log('\\n6. Alternative pattern:');
const alt = /([A-Za-z]+),\\s+([A-Za-z]+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
console.log('   Pattern:', alt);
console.log('   Match:', testString.match(alt));