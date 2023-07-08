const { Queue } = require('.');

async function consume(params) {
  const queue = new Queue(params);

  for await (const message of queue.receiveMessages()) {
    console.log(message);

    await queue.deleteMessage(message);
  }
}

consume({
  region: "us-east-1",
  profile: "default",
  endpoint: "https://sqs.us-east-1.amazonaws.com/367988507966/spotlight-test",
  QueueUrl: "https://sqs.us-east-1.amazonaws.com/367988507966/spotlight-test",
});