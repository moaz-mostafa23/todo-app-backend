import { RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export class DatabaseConstruct extends Construct {
  public readonly todosTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // DDB
    this.todosTable = new dynamodb.Table(this, 'TodosTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'todoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // deletes table on cdk destroy
    });

    new CfnOutput(this, 'TodosTableNameOutput', {
      value: this.todosTable.tableName,
      exportName: 'TodosTableName',
    });
  }

  public grantReadAccess(lambda: lambda.Function): void {
    this.todosTable.grantReadData(lambda);
  }

  public grantWriteAccess(lambda: lambda.Function): void {
    this.todosTable.grantWriteData(lambda);
  }
}
