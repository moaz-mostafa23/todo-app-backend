import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

interface LambdaHandler {
    (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>;
}

export const withCors = (handler: LambdaHandler): LambdaHandler => async (
    event: APIGatewayProxyEvent, 
    context: Context
): Promise<APIGatewayProxyResult> => {
    const response = await handler(event, context);
    return {
        ...response,
        headers: {
            ...(response.headers || {}),
            'Access-Control-Allow-Origin': 'https://d28lrt0tauqwup.cloudfront.net',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
        },
    };
};