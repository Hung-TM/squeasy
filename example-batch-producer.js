const { Queue } = require('.');

async function produce(params) {
  const queue = new Queue(params);

  const batch = new Array(10).fill().map((_, i) => {
    return {
      Id: `MessageId${i}`,
      MessageBody: `MessageBody${i}`,
    };
  });

  const result = await queue.sendBatch(batch);

  console.log(result);
}

produce({
  region: process.env.SQS_REGION,
  profile: process.env.SQS_PROFILE,
  endpoint: process.env.SQS_ENDPOINT,
  QueueUrl: process.env.SQS_QUEUE_URL,
});
