import { spawn } from 'child_process';

const run = (file) =>
  new Promise((resolve, reject) => {
    const p = spawn('node', [file], { stdio: 'inherit' });
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${file} failed with exit code ${code}`));
    });
  });

console.log('====================================================');
console.log('[TEST RUNNER] Executing All Test Suites');
console.log('====================================================\n');

try {
  await run('tests/outfits.test.mjs');
  console.log('\n');
  await run('tests/analytics.test.mjs');
  console.log('\n');
  await run('tests/recommendations.test.mjs');
  console.log('\n====================================================');
  console.log('[TEST RUNNER] All Test Suites Passed Successfully');
  console.log('====================================================');
} catch (err) {
  console.error('\n[TEST RUNNER ERROR]', err.message);
  process.exit(1);
}
