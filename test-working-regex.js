const testString = "Thursday, August 14 - beschikbare tijden";
console.log(`Testing: "${testString}"`);

// This should work
const workingPattern = /(\w+),\s+(\w+)\s+(\d{1,2})\s+-\s+beschikbare tijden/;
const match = testString.match(workingPattern);
console.log("Match:", match);

if (match) {
    const [, dayName, monthName, day] = match;
    console.log(`✅ Day: ${dayName}, Month: ${monthName}, Day: ${day}`);
} else {
    console.log("❌ No match");
}