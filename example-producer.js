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
  region: "us-east-1",
  profile: "default",
  endpoint: "https://sqs.us-east-1.amazonaws.com/367988507966/spotlight-test",
  QueueUrl: "https://sqs.us-east-1.amazonaws.com/367988507966/spotlight-test",
});
