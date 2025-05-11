import { Stack, StackProps, CfnOutput, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as identitypool from 'aws-cdk-lib/aws-cognito-identitypool';
import { DatabaseConstruct } from './constructs/database-construct';
import { ApiConstruct } from './constructs/api-construct';
import { WebsiteConstruct } from './constructs/website-construct';

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

    const identityPool = new identitypool.IdentityPool(this, 'TodoIdentityPool', {
      allowUnauthenticatedIdentities: false,
      authenticationProviders: {
        userPools: [
          new identitypool.UserPoolAuthenticationProvider({
            userPool: this.userPool,
            userPoolClient: this.userPoolClient,
          }),
        ],
      },
    });

    new CfnOutput(this, 'IdentityPoolId', {
      value: identityPool.identityPoolId,
      exportName: 'CognitoIdentityPoolId',
    });

    new CfnOutput(this, 'UserPoolIdOutput', {
      value: this.userPool.userPoolId,
      exportName: 'CognitoUserPoolId',
    });

    new CfnOutput(this, 'UserPoolClientIdOutput', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'CognitoUserPoolClientId',
    });

    const database = new DatabaseConstruct(this, 'Database');

    new ApiConstruct(this, 'Api', {
      userPool: this.userPool,
      database,
    });

    new WebsiteConstruct(this, 'Website');

  }
}
