const myPromise = new Promise((resolve, reject) => {
  //resolve('Operation was successful!');
  reject('Something went wrong.');
});

// myPromise
//   .then(res => {
//     console.log("The promise succeeded");
//   })
//   .catch(error => {
//     console.error(error);
//   });

// myPromise
//   .catch(error => {
//     console.error(error);
//   });

myPromise.then((res) => {
  console.log(res);
});
