function makePromiseChain(success) {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      success
        ? resolve('PROMISE RESOLVED')
        : reject(new Error('PROMISE REJECTED'));
    }, 300);
  });

  promise
    .catch((err) => {
      console.log('CATCH: ' + err.message);
      //throw new Error('ERROR CATCH');
      return 'CATCH';
    })
    .then((res) => {
      console.log(res);
      //throw new Error('ERROR THEN');
      return 'THEN';
    })
    .finally(() => {
      console.log('FINALLY');
    });
  // .then((msg) => {
  //   console.log('THEN: ' + msg);
  // });
  // .then(() => {
  //   console.log('FINALLY');
  // });
  // .finally(() => {
  //   console.log('FINALLY 2');
  //   throw new Error('Error finally 2');
  // })
  // .then((finallyRet) => {
  //   console.log(finallyRet);
  //   //throw new Error('Error finally + then');
  //   return 'finally + then';
  // })
  // .catch((err) => {
  //   console.log('ERROR 2: ' + err);
  // });
}

makePromiseChain(true);
//makePromiseChain(false);
