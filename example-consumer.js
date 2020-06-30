const { Queue } = require('.');

async function consume(params) {
  const queue = new Queue(params);

  for await (const message of queue.receiveMessages()) {
    console.log(message);

    await queue.deleteMessage(message);
  }
}

consume({
  region: process.env.SQS_REGION,
  profile: process.env.SQS_PROFILE,
  endpoint: process.env.SQS_ENDPOINT,
  QueueUrl: process.env.SQS_QUEUE_URL
});
