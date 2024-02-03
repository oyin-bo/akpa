const { streamBuffer, streamEvery, mergeMap } = require('./index');

(async () => {
  console.log('streamEvery...');
  await logAsync(streamEvery(({ yield, complete }) => generateYields(yield).then(complete)));

  console.log('\n\n\nstreamBuffer...');
  await logAsync(streamBuffer(({ yield, complete }) => generateYields(yield).then(complete)));
})();


async function generateYields(yield) {
  yield(wrapWithLog('quick 1'));
  yield(wrapWithLog('quick 2'));
  await yield(wrapWithLog('3 and wait'));

  yield(wrapWithLog('quick second: 1'));
  yield(wrapWithLog('quick second: 2'));
  await yield(wrapWithLog('second: 3 and wait'));

  await wait(1000);
  yield(wrapWithLog('after a second'));

  await wait(1000);
  console.log(' /ITERATOR-EXIT/ ');

  function wait(time) { return new Promise(resolve => setTimeout(resolve, time)); }

  function wrapWithLog(item) {
    console.log('       GENERATED >> ', item);
    return item;
  }
}

async function logAsync(asyncGen) {
  for await (const item of asyncGen) {
    await prompt('RECEIVED << ' + item + ' (continue?)');
  }

  function prompt(txt) {
    return new Promise(resolve => {
      const readline = require('readline');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(txt, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}
