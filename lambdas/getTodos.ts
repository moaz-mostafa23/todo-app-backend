import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { withCors } from '../lib/middleware';

const ddb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TODOS_TABLE!;

export const handler: APIGatewayProxyHandler = withCors(async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const result = await ddb.query({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: {
      ':uid': userId,
    },
  }).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
})
