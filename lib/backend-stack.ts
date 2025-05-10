import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class TodoAppBackendStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
  }
}
