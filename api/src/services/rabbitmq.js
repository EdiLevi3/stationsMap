import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();

let channel;
const connectRabbitMQ = async () => {
  if (channel) {
    return channel;
  }
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
  }
};

const publishToConvertQueue = async (taskName, args = []) => {
  const channel = await connectRabbitMQ();
  const exchange = process.env.CELERY_EXCHANGE;
  const routingKey = process.env.QUEUE_TO_CONVERT;
  await channel.assertExchange(exchange, "direct", { durable: true });
  const taskId = `${Date.now()}-${taskName}`;
  const message = {
    id: taskId,
    task: taskName,
    args: args,
    kwargs: {},
    expires: null,
    eta: null,
  };
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
    contentType: "application/json",
    persistent: true,
  });

  return taskId;
};

export { publishToConvertQueue };
