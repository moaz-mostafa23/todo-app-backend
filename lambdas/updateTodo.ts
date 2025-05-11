import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { withCors } from '../lib/middleware';

const ddb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TODOS_TABLE!;

export const handler: APIGatewayProxyHandler = withCors(async (event) => {
  const userId = event.requestContext.authorizer?.claims?.sub;
  const todoId = event.pathParameters?.id;
  const { title, completed } = JSON.parse(event.body || '{}');

  if (!userId || !todoId) {
    return { statusCode: 400, body: 'Missing userId or todoId' };
  }

  let updateExpression = 'set';
  const expressionAttributeValues: Record<string, any> = {};

  if (title) {
    updateExpression += ' title = :t,';
    expressionAttributeValues[':t'] = title;
  }

  if (completed !== undefined) {
    updateExpression += ' completed = :c,';
    expressionAttributeValues[':c'] = completed;
  }

  updateExpression = updateExpression.endsWith(',')
    ? updateExpression.slice(0, -1)
    : updateExpression;

  if (Object.keys(expressionAttributeValues).length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No fields to update provided' })
    };
  }

  const updateResult = await ddb.update({
    TableName: TABLE_NAME,
    Key: { userId, todoId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' 
  }).promise();

  const updatedTodo = updateResult.Attributes;

  return {
    statusCode: 200,
    body: JSON.stringify(updatedTodo)
  };
}) 
