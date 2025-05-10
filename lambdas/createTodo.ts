import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const ddb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TODOS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event: any) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  const { title } = JSON.parse(event.body || '{}');

  if (!userId || !title) {
    return { statusCode: 400, body: 'Missing userId or title' };
  }

  const todoItem = {
    userId,
    todoId: uuidv4(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  await ddb.put({
    TableName: TABLE_NAME,
    Item: todoItem,
  }).promise();

  return {
    statusCode: 201,
    body: JSON.stringify(todoItem),
  };
};
