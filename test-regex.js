#!/usr/bin/env node

// Test the regex pattern with the actual string we found
const testString = "Thursday, August 14 - beschikbare tijden";
console.log(`Testing string: "${testString}"`);

// Current regex pattern (with proper escaping)
const currentPattern = /(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/;
console.log(`Current pattern: ${currentPattern}`);

const match = testString.match(currentPattern);
console.log('Match result:', match);

if (match) {
    console.log('✅ Regex matched!');
    const [, dayName, monthName, day] = match;
    console.log(`Day: ${dayName}, Month: ${monthName}, Day: ${day}`);
} else {
    console.log('❌ Regex did not match');
    
    // Let's try the correct pattern (single backslashes)
    const correctPattern = /(\\w+),\\s+(\\w+)\\s+(\\d{1,2})\\s+-\\s+beschikbare tijden/;
    const correctMatch = testString.match(correctPattern);
    console.log('Correct pattern match:', correctMatch);
    
    if (correctMatch) {
        console.log('✅ Correct regex matched!');
        const [, dayName, monthName, day] = correctMatch;
        console.log(`Day: ${dayName}, Month: ${monthName}, Day: ${day}`);
    }
}