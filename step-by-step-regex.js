const testString = "Thursday, August 14 - beschikbare tijden";

console.log("Testing step by step:");
console.log(`Full string: "${testString}"`);

// Step 1: Match day name
const dayPattern = /^(\\w+)/;
const dayMatch = testString.match(dayPattern);
console.log("Day match:", dayMatch);

// Step 2: Match comma and space
const commaPattern = /^(\\w+),\\s+/;
const commaMatch = testString.match(commaPattern);
console.log("Comma match:", commaMatch);

// Step 3: Match month
const monthPattern = /^(\\w+),\\s+(\\w+)/;
const monthMatch = testString.match(monthPattern);
console.log("Month match:", monthMatch);

// Step 4: Match day number
const dayNumPattern = /^(\\w+),\\s+(\\w+)\\s+(\\d+)/;
const dayNumMatch = testString.match(dayNumPattern);
console.log("Day num match:", dayNumMatch);

// Step 5: Match dash
const dashPattern = /^(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-/;
const dashMatch = testString.match(dashPattern);
console.log("Dash match:", dashMatch);

// Step 6: Full pattern
const fullPattern = /^(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-\\s+beschikbare tijden$/;
const fullMatch = testString.match(fullPattern);
console.log("Full match:", fullMatch);

// Alternative: Try without anchors
const altPattern = /(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
const altMatch = testString.match(altPattern);
console.log("Alt match:", altMatch);

// Working pattern!
const workingPattern = /(\\w+),\\s+(\\w+)\\s+(\\d+)\\s+-\\s+beschikbare tijden/;
const workingMatch = testString.match(workingPattern);
console.log("Working match:", workingMatch);