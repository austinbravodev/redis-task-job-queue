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
    .then((msg) => {
      console.log('THEN' + msg);

      return setTimeout(2000, 'SET TIMEOUT PROMISE').then((res) => {
        //console.log('SET TIMEOUT PROMISE FULFILLED');
        return setTimeout(2000, 'SET TIMEOUT PROMISE 2').then((res2) => {
          //throw new Error("SET TIMEOUT PROMISE CALLBACK ERROR");
          return setTimeout(2000, 'SET TIMEOUT PROMISE 3');
        });
      });
    })
    .then((res) => {
      console.log('THEN 2' + res);
    })
    .catch((err) => {
      console.log('CATCH 2: ' + err.message);
      return 'CATCH 2';
    })
    .finally(() => {
      console.log('FINALLY');
      //throw new Error('ERROR FINALLY');
    });
}

//makePromiseChain(true);
makePromiseChain(false);
