# SQueaSy

This package provides a wrapper around the AWS SDK's SQS service object primarily to enable asynchronously iterating over messages in a queue like this:

```javascript
const queue = new Queue({ QueueUrl: process.env.MY_QUEUE_URL });

for await (const message of queue.receiveMessages()) {
  // process `message` here

  await queue.deleteMessage(message);
}
```

It also provides other helpers for working with SQS to help reduce some of the boilerplate I find myself repeatedly writing (copy/pasting) in my projects.

## Installation

This package requires the aws-sdk package as a peer dependency so install that, too:

```shell
npm i squeasy aws-sdk
```

## API

Note about property names: The AWS SDK uses camelCased property names in options passed in to the SQS constructor and PascalCased property names in parameters passed in to methods. To keep the code simple, this library does _not_ try to hide that so be sure to use `QueueUrl` and not `queueUrl`. 😢

### Queue

The `Queue` constructor accepts the following options:

- QueueUrl: URL of queue (recommended, please notice the capital Q)
- sqs: `AWS.SQS` service object to use, otherwise following options are used to construct a new one:
- region: AWS region (default: `process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION`)
- credentials: AWS credentials to use
- profile: AWS profile to use, only used if no `credentials`
- endpoint: URL of SQS service
- httpOptions: custom HTTP options
- keepAlive: use HTTP keep alive connections (default: true), only used if no `httpOptions`

In addition to those options, the parameters for other methods can be passed in to the constructor as options (like `QueueUrl`, `MaxNumberOfMessages`, `VisibilityTimeout`, etc) so they can be configured in one place and don't have to be repeatedly passed in to the other methods.

```javascript
const { Queue } = require('squeasy');

const queue = new Queue({
  QueueUrl: process.env.MY_QUEUE_URL,
});
```

### receiveBatches

Asynchronously iterates over batches of messages in a queue. Accepts the same parameters as `receiveMessage` in the AWS SDK except `QueueUrl` can be omitted if passed in to the constructor.

Note: The default value for `MaxNumberOfMessages` is 10 when calling this function which is different from the default value the AWS SDK uses for its `receiveMessage` method (1). The default value for `WaitTimeSeconds` is 20 which is also different from the AWS SDK (default is 0 when queue gets created).

```javascript
for await (const batch of queue.receiveBatches()) {
  for (const message of batch.Messages) {
    console.log(message);
  }

  await queue.deleteBatch(batch);
}
```

### receiveMessages

Asynchronously iterates over individual messages in a queue. Uses the same parameters as `receiveBatches` except the default for `MaxNumberOfMessages` is 1. If this is set to a number greater than 1, messages will be retrieved in batches from AWS but this function only yields one message at a time so be sure your `VisibilityTimeout` isn't too low (default is 30 when queue gets created).

```javascript
for await (const message of queue.receiveMessages()) {
  console.log(message);

  await queue.deleteMessage(message);
}
```

### deleteBatch

Deletes a batch of messages as yielded from `receiveBatches`. The parameter can be an array or an object with a `Messages` property set to an array of objects with `MessageId` and `ReceiptHandle` properties.

```javascript
const result = await queue.deleteBatch(batch);
```

### deleteMessage

Deletes a single message. The message expected to be an object with a `ReceiptHandle` property.

```javascript
const result = await queue.deleteMessage(message);
```

### sendBatch

Accepts all the same parameters as `sendMessageBatch` in the AWS SDK except `QueueUrl` can be omitted if passed in to the constructor. Also accepts an array of objects instead of an object with an `Entries` property.

```javascript
const result = await queue.sendBatch([
  { Id: 'messageId1', MessageBody: 'messageBody1' },
  { Id: 'messageId2', MessageBody: 'messageBody2' },
]);
```

### sendMessage

Accepts all the same parameters as `sendMessage` in the AWS SDK except `QueueUrl` can be omitted if passed in to the constructor.

```javascript
const result = await queue.sendMessage({
  MessageBody: 'messageBody',
});
```

## Testing

For testing against a local SQS queue, put this in ~/.aws/credentials:

```ini
[local]
region = local
aws_access_key_id = xxx
aws_secret_access_key = xxx
```

Those `xxx` values are meant to be literal. There is no need to put real credentials here.

Run a local SQS server (requires Docker):

```shell
docker run --rm -p 9324:9324 softwaremill/elasticmq
```

Create a queue:

```shell
aws sqs create-queue \
    --profile local \
    --endpoint http://localhost:9324 \
    --queue-name local-queue

# or

SQS_REGION=local \
SQS_PROFILE=local \
SQS_ENDPOINT=http://localhost:9324 \
SQS_QUEUE_NAME=local-queue \
node example-create.js
```

Run the example producer:

```shell
SQS_REGION=local \
SQS_PROFILE=local \
SQS_ENDPOINT=http://localhost:9324 \
SQS_QUEUE_URL=http://localhost:9324/queue/local-queue \
node example-producer.js
```

Run the example consumer:

```shell
SQS_REGION=local \
SQS_PROFILE=local \
SQS_ENDPOINT=http://localhost:9324 \
SQS_QUEUE_URL=http://localhost:9324/queue/local-queue \
node example-consumer.js
```
