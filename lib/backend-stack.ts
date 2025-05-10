import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';


export class TodoAppBackendStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // COGNITO
    this.userPool = new cognito.UserPool(this, 'TodoUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'TodoUserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
    });

    new cognito.CfnUserPoolDomain(this, 'UserPoolDomain', {
      domain: 'todo-app-' + this.stackName.toLowerCase(),
      userPoolId: this.userPool.userPoolId,
    });

    new CfnOutput(this, 'UserPoolIdOutput', {
      value: this.userPool.userPoolId,
      exportName: 'CognitoUserPoolId',
    });

    new CfnOutput(this, 'UserPoolClientIdOutput', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'CognitoUserPoolClientId',
    });


    //DDB
    const todosTable = new dynamodb.Table(this, 'TodosTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'todoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // deletes table on cdk destroy
    });

    new CfnOutput(this, 'TodosTableNameOutput', {
      value: todosTable.tableName,
      exportName: 'TodosTableName',
    });


    //lambdas
    const createTodoLambda = new nodejs.NodejsFunction(this, 'CreateTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambdas/createTodo.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: todosTable.tableName,
      },
    });
    todosTable.grantWriteData(createTodoLambda);

    const getTodosLambda = new nodejs.NodejsFunction(this, 'GetTodosFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambdas/getTodos.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: todosTable.tableName,
      },
    });
    todosTable.grantWriteData(getTodosLambda);

    const updateTodoLambda = new nodejs.NodejsFunction(this, 'UpdateTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambdas/updateTodo.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: todosTable.tableName,
      },
    });
    todosTable.grantWriteData(updateTodoLambda);

    const deleteTodoLambda = new nodejs.NodejsFunction(this, 'DeleteTodoFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambdas/deleteTodo.ts'),
      handler: 'handler',
      environment: {
        TODOS_TABLE: todosTable.tableName,
      },
    });
    todosTable.grantWriteData(deleteTodoLambda);


    // API GW
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo Service',
    });


    // AUTHORIZER
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TodoAuthorizer', {
      cognitoUserPools: [this.userPool],
    });

    const todosResource = api.root.addResource('todos');


    // ROUTES
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


    new CfnOutput(this, 'ApiUrl', {
      value: api.url!,
      exportName: 'TodoApiUrl',
    });

  }
}
