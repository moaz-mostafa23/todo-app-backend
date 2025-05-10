import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const ddb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TODOS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  const todoId = event.pathParameters?.id;

  if (!userId || !todoId) {
    return { statusCode: 400, body: 'Missing userId or todoId' };
  }

  await ddb.delete({
    TableName: TABLE_NAME,
    Key: { userId, todoId },
  }).promise();

  return { statusCode: 200, body: JSON.stringify({ message: 'Todo deleted' }) };
};
