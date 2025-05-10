import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const ddb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TODOS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  const todoId = event.pathParameters?.id;
  const { title, completed } = JSON.parse(event.body || '{}');

  if (!userId || !todoId) {
    return { statusCode: 400, body: 'Missing userId or todoId' };
  }

  await ddb.update({
    TableName: TABLE_NAME,
    Key: { userId, todoId },
    UpdateExpression: 'set title = :t, completed = :c',
    ExpressionAttributeValues: {
      ':t': title,
      ':c': completed,
    },
  }).promise();

  return { statusCode: 200, body: JSON.stringify({ message: 'Todo updated' }) };
};
