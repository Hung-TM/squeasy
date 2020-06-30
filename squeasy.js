const debug = require('debug')('squeasy');
const AWS = require('aws-sdk');
const http = require('http');
const https = require('https');

class Queue {
  constructor(options) {
    this.sqs = options.sqs || createServiceObject(options);
    this.options = { ...options, sqs: this.sqs };
  }

  async create(params) {
    const result = await createQueue({ ...this.options, ...params });

    this.options.QueueUrl = result.QueueUrl;

    return result;
  }

  receiveBatches(params) {
    return receiveBatches({ ...this.options, ...params });
  }

  receiveMessages(params) {
    return receiveMessages({ ...this.options, ...params });
  }

  async deleteBatch(params) {
    return deleteBatch(
      Array.isArray(params)
        ? { ...this.options, Entries: params }
        : { ...this.options, ...params }
    );
  }

  async deleteMessage(params) {
    return deleteMessage({ ...this.options, ...params });
  }

  sendBatch(params) {
    return sendBatch(
      Array.isArray(params)
        ? { ...this.options, Entries: params }
        : { ...this.options, ...params }
    );
  }

  sendMessage(params) {
    return sendMessage({ ...this.options, ...params });
  }
}

function createServiceObject(options) {
  return new AWS.SQS({
    region:
      options.region ||
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION,
    credentials:
      options.credentials ||
      (options.profile
        ? new AWS.SharedIniFileCredentials({ profile: options.profile })
        : null),
    endpoint: options.endpoint,
    httpOptions: options.httpOptions || {
      agent: new ((options.endpoint || options.QueueUrl || '').startsWith(
        'http:'
      )
        ? http
        : https
      ).Agent({
        keepAlive: options.keepAlive !== false,
      }),
    },
  });
}

async function createQueue(params) {
  const sqs = params.sqs || createServiceObject(params);

  const createQueueParams = {
    QueueName: params.QueueName,
    Attributes: params.Attributes,
  };

  debug('createQueue params', createQueueParams);

  const result = await sqs.createQueue(createQueueParams).promise();

  debug('createQueue result', result);

  return result;
}

async function* iterate(params, defaultMaxNumberOfMessages) {
  const sqs = params.sqs || createServiceObject(params);

  const receiveMessageParams = {
    QueueUrl: params.QueueUrl,
    AttributeNames: params.AttributeNames,
    MaxNumberOfMessages:
      params.MaxNumberOfMessages || defaultMaxNumberOfMessages,
    MessageAttributeNames: params.MessageAttributeNames,
    VisibilityTimeout: params.VisibilityTimeout,
    WaitTimeSeconds:
      params.WaitTimeSeconds !== undefined ? params.WaitTimeSeconds : 20,
  };

  while (true) {
    debug('receiveMessage params', receiveMessageParams);

    const result = await sqs.receiveMessage(receiveMessageParams).promise();

    debug('receiveMessage result', result);

    if (!result.Messages) {
      result.Messages = [];
    }

    yield result;
  }
}

async function* receiveBatches(params) {
  for await (const batch of iterate(params, 10)) {
    yield batch;
  }
}

async function* receiveMessages(params) {
  for await (const batch of iterate(params, 1)) {
    for (const message of batch.Messages) {
      yield message;
    }
  }
}

async function deleteBatch(params) {
  const sqs = params.sqs || createServiceObject(params);

  const entries = (params.Entries || params.Messages).map((entry) => {
    return {
      Id: entry.Id || entry.MessageId,
      ReceiptHandle: entry.ReceiptHandle,
    };
  });

  const deleteMessageBatchParams = {
    QueueUrl: params.QueueUrl,
    Entries: entries,
  };

  debug('deleteMessageBatch params', deleteMessageBatchParams);

  const result = await sqs
    .deleteMessageBatch(deleteMessageBatchParams)
    .promise();

  debug('deleteMessageBatch result', result);

  return result;
}

async function deleteMessage(params) {
  const sqs = params.sqs || createServiceObject(params);

  const deleteMessageParams = {
    QueueUrl: params.QueueUrl,
    ReceiptHandle: params.ReceiptHandle,
  };

  debug('deleteMessage params', deleteMessageParams);

  const result = await sqs.deleteMessage(deleteMessageParams).promise();

  debug('deleteMessage result', result);

  return result;
}

async function sendBatch(params) {
  const sqs = params.sqs || createServiceObject(params);

  const sendMessageBatchParams = {
    QueueUrl: params.QueueUrl,
    Entries: params.entries.map((entry) => {
      return {
        Id: entry.Id,
        MessageBody: entry.MessageBody,
        DelaySeconds: entry.DelaySeconds,
        MessageAttributes: entry.MessageAttributes,
        MessageDeduplicationId: entry.MessageDeduplicationId,
        MessageGroupId: entry.MessageGroupId,
        MessageSystemAttributes: entry.MessageSystemAttributes,
      };
    }),
  };

  debug('sendMessageBatch params', sendMessageBatchParams);

  const result = await sqs.sendMessageBatch(sendMessageBatchParams).promise();

  debug('sendMessageBatch result', result);

  return result;
}

async function sendMessage(params) {
  const sqs = params.sqs || createServiceObject(params);

  const sendMessageParams = {
    QueueUrl: params.QueueUrl,
    MessageBody: params.MessageBody,
    DelaySeconds: params.DelaySeconds,
    MessageAttributes: params.MessageAttributes,
    MessageDeduplicationId: params.MessageDeduplicationId,
    MessageGroupId: params.MessageGroupId,
    MessageSystemAttributes: params.MessageSystemAttributes,
  };

  debug('sendMessage params', sendMessageParams);

  const result = await sqs.sendMessage(sendMessageParams).promise();

  debug('sendMessage result', result);

  return result;
}

exports.Queue = Queue;
exports.createServiceObject = createServiceObject;
exports.receiveBatches = receiveBatches;
exports.receiveMessages = receiveMessages;
exports.deleteBatch = deleteBatch;
exports.deleteMessage = deleteMessage;
exports.sendBatch = sendBatch;
exports.sendMessage = sendMessage;
