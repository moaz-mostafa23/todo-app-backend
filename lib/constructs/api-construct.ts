import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { CfnOutput } from 'aws-cdk-lib';
import { DatabaseConstruct } from './database-construct';

export interface ApiConstructProps {
  userPool: cognito.UserPool;
  database: DatabaseConstruct;
}

export class ApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { userPool, database } = props;

    // Lambda Functions
    const createTodoLambda = new nodejs.NodejsFunction(this, 'CreateTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambdas/createTodo.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: database.todosTable.tableName,
      },
    });
    database.grantWriteAccess(createTodoLambda);

    const getTodosLambda = new nodejs.NodejsFunction(this, 'GetTodosFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambdas/getTodos.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: database.todosTable.tableName,
      },
    });
    database.grantReadAccess(getTodosLambda);

    const updateTodoLambda = new nodejs.NodejsFunction(this, 'UpdateTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambdas/updateTodo.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: database.todosTable.tableName,
      },
    });
    database.grantWriteAccess(updateTodoLambda);

    const deleteTodoLambda = new nodejs.NodejsFunction(this, 'DeleteTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../../lambdas/deleteTodo.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: database.todosTable.tableName,
      },
    });
    database.grantWriteAccess(deleteTodoLambda);

    // API Gateway
    this.api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      }
    });

    // API Gateway Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TodoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const todosResource = this.api.root.addResource('todos');

    // API Routes
    todosResource.addMethod('POST', new apigateway.LambdaIntegration(createTodoLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    todosResource.addMethod('GET', new apigateway.LambdaIntegration(getTodosLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const todoItemResource = todosResource.addResource('{id}');

    todoItemResource.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    todoItemResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    this.apiUrl = this.api.url!;

    new CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      exportName: 'TodoApiUrl',
    });
  }
}
