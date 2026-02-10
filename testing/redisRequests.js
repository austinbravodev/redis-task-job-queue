import { createClient } from 'redis';

const client = createClient();
client.on('error', (err) => console.error('Redis client error:', err));
await client.connect();

const result = await client
  .lPush('yo', 'ho')
  .then((res1) => {
    console.log('res1: ' + res1);

    // const e = new Error("custom error");
    // e.stack = undefined;
    // throw e;

    //return client.zRange('yo', 0, 10);
    return client.lRem('ho', 'hi', 'whoah');
  })
  .then((res2) => {
    console.log('res2: ' + res2);
  })
  .catch((err) => {
    console.error();
    console.error(err);
    console.error();

    console.error('err.name' + ': ' + err.name);
    console.error('err.constructor.name' + ': ' + err.constructor.name);
    for (const p of Object.getOwnPropertyNames(err)) {
      console.error('err.' + p + ': ' + err[p]);
    }
  })
  .finally(() => client.flushAll('SYNC'))
  .finally(() => client.disconnect());
