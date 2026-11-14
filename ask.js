import { answer } from './lib/answer.js';

const question = process.argv.slice(2).join(' ');
if (!question) {
  console.log('Usage: node ask.js "<your question>"');
  process.exit(1);
}

console.log(`\nQuery: "${question}"\n`);
const started = Date.now();

const result = await answer(question, (event, data) => {
  if (event === 'status') {
    process.stderr.write(`… ${data.text}\n`);
  }
});

console.log('\n--- Final Response ---\n');
console.log(result);
console.log(`\n⏱ Completed in ${((Date.now() - started) / 1000).toFixed(2)}s\n`);
