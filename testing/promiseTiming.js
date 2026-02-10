import { setTimeout } from 'node:timers/promises';

function makePromiseChain(success) {
  const promise = new Promise((resolve, reject) => {
    success
      ? resolve('PROMISE RESOLVED')
      : reject(new Error('PROMISE REJECTED'));
  });

  promise
    .then((res) => {
      console.log(res);
      //throw new Error('ERROR THEN');
      return 'THEN';
    })
    .catch((err) => {
      console.log('CATCH: ' + err.message);
      //throw new Error('ERROR CATCH');
      return 'CATCH';
    })
    .then(() => {
      console.log('THEN');

      // return setImmediate(() => { console.log("SET IMMEDIATE"); });
      // setTimeout(() => {
      //   console.log("SET TIMEOUT");
      // }, 2000);

      return setTimeout(2000, 'SET TIMEOUT PROMISE');
    })
    .then(() => {
      console.log('THEN 2');
    })
    .finally(() => {
      console.log('FINALLY 2');
      //throw new Error('ERROR FINALLY 2');
    });
}

//makePromiseChain(true);
makePromiseChain(false);
