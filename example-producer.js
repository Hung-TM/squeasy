const { Queue } = require('.');

async function produce(params) {
  const queue = new Queue(params);

  for (let i = 0; i < 10; i++) {
    const message = {
      MessageBody: `MessageBody${i}`,
    };

    const result = await queue.sendMessage(message);

    console.log(result);
  }
}

produce({
  region: process.env.SQS_REGION,
  profile: process.env.SQS_PROFILE,
  endpoint: process.env.SQS_ENDPOINT,
  QueueUrl: process.env.SQS_QUEUE_URL,
});
