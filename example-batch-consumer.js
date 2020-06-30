const { Queue } = require('.');

async function consume(params) {
  const queue = new Queue(params);

  for await (const batch of queue.receiveBatches()) {
    console.log(`received batch of ${batch.Messages.length} messages`);

    for (const message of batch.Messages) {
      console.log(message);
    }

    await queue.deleteBatch(batch);
  }
}

consume({
  region: process.env.SQS_REGION,
  profile: process.env.SQS_PROFILE,
  endpoint: process.env.SQS_ENDPOINT,
  QueueUrl: process.env.SQS_QUEUE_URL,
});
