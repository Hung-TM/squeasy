const { Queue } = require('.');

async function create(params) {
  const queue = new Queue(params);

  const result = await queue.create(params.queueName);

  console.log(result);

  console.log(queue.options.QueueUrl);
}

create({
  region: process.env.SQS_REGION,
  profile: process.env.SQS_PROFILE,
  endpoint: process.env.SQS_ENDPOINT,
  QueueName: process.env.SQS_QUEUE_NAME,
});
