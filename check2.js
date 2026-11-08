const fs = require('fs');
const v8 = require('v8');
const src = fs.readFileSync('assets/js/app.js', 'utf8');
try {
  new Function(src);
  console.log('OK - no syntax errors');
} catch(e) {
  // Get line number from stack
  console.log('ERROR:', e.message);
  console.log(e.stack);
}
