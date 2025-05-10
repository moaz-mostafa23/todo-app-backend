import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

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
  }
}
