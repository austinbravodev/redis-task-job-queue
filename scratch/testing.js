import assert from 'node:assert/strict';
import { createClient } from 'redis';

const client = createClient();
client.on('error', (err) => console.error('Redis client error:', err));
await client.connect();

try {
  // TEST needing to reverse retryJobs and blMove RIGHT, LEFT (and l or rpush)

  // await client.zAdd(
  //   "retries",
  //   {
  //     score: 1,
  //     value: "one",
  //   },
  // );

  // await client.zAdd(
  //   "retries",
  //   {
  //     score: 3,
  //     value: "three",
  //   },
  // );

  // await client.zAdd(
  //   "retries",
  //   {
  //     score: 2,
  //     value: "two",
  //   },
  // );

  // await client.lPush("jobs", "zero");

  // const r = await client.zRange("retries", 0, Date.now(), { BY: 'SCORE' });

  // await client.lPush("jobs", r);

  // const n = await client.zRem("retries", r);
  // console.log("n = " + n);

  // await client.lPush("jobs", "five");

  // let i = 0;

  // while (i < 6) {
  //   const j = await client.blMove(
  //     "jobs",
  //     "processing",
  //     'RIGHT',
  //     'LEFT',
  //     3,
  //   );

  //   if (j) {
  //     console.log("j = " + j);

  //     const removed = await client.lRem("processing", 0, j);
  //     console.log("removed = " + removed);
  //   }

  //   i++;
  // }

  // TEST processing list ltrim end index

  // const stranded = ["one", "two", "three"];
  // await client.lPush("processing", stranded);
  // const lRange1 = await client.lRange("processing", 0, -1);

  // const jobs = ["four", "five"];
  // await client.lPush("processing", jobs);

  // const res = await client.lTrim("processing", 0, -(stranded.length + 1));
  // console.log("lTrim: " + res);

  // const lRange2 = await client.lRange("processing", 0, -1);
  // console.log(lRange2);

  // TEST lRange on nonexistent list

  // const els = await client.lRange('listdoesnotexist', 0, -1);

  // console.log('els = ');
  // console.log(els);

  // console.log('els.length = ');
  // console.log(els.length);

  // TEST zRem with []

  // await client.zAdd(
  //   "retries",
  //   {
  //     score: 1,
  //     value: "one",
  //   },
  // );

  // await client.zAdd(
  //   "retries",
  //   {
  //     score: 3,
  //     value: "three",
  //   },
  // );

  // await client.zAdd(
  //   "retries",
  //   {
  //     score: 2,
  //     value: "two",
  //   },
  // );

  // const zRange1 = await client.zRange("retries", 0, Date.now(), { BY: 'SCORE' });
  // console.log(zRange1);

  // const zRem1 = await client.zRem("retries", zRange1);
  // console.log(zRem1);

  // const zRange2 = await client.zRange("retries", 0, Date.now(), { BY: 'SCORE' });
  // console.log(zRange2);

  // const zRem2 = await client.zRem("retries", zRange2);
  // console.log(zRem2);

  // TEST lPush empty list

  const lPush = await client.lPush("whoahhhhhhi", []);
  console.log(lPush);

  // TEST blmove null reply

  // await client.lPush("startList", "");

  // const blMove = await client.blMove(
  //   "startList",
  //   "endList",
  //   'RIGHT',
  //   'LEFT',
  //   3,
  // )
  // console.log("~" + blMove + "~");
} finally {
  await client.flushAll('SYNC');
  await client.disconnect();
}

// haven't been disconnecting in any tests - does it matter?
