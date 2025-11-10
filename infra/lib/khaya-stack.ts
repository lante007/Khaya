import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class KhayaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ===== DynamoDB Tables (Pay-per-request for autonomous scaling) =====
    
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: true,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: 'PhoneIndex',
      partitionKey: { name: 'phone', type: dynamodb.AttributeType.STRING },
    });

    const profilesTable = new dynamodb.Table(this, 'ProfilesTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    profilesTable.addGlobalSecondaryIndex({
      indexName: 'LocationIndex',
      partitionKey: { name: 'location', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'trustScore', type: dynamodb.AttributeType.NUMBER },
    });

    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    jobsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const bidsTable = new dynamodb.Table(this, 'BidsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    bidsTable.addGlobalSecondaryIndex({
      indexName: 'JobIndex',
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'amount', type: dynamodb.AttributeType.NUMBER },
    });

    const listingsTable = new dynamodb.Table(this, 'ListingsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    listingsTable.addGlobalSecondaryIndex({
      indexName: 'CategoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    const reviewsTable = new dynamodb.Table(this, 'ReviewsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'reviewedId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const creditsTable = new dynamodb.Table(this, 'CreditsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const referralsTable = new dynamodb.Table(this, 'ReferralsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    referralsTable.addGlobalSecondaryIndex({
      indexName: 'CodeIndex',
      partitionKey: { name: 'referralCode', type: dynamodb.AttributeType.STRING },
    });

    const storiesTable = new dynamodb.Table(this, 'StoriesTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ===== Cognito User Pool for Authentication =====
    
    const userPool = new cognito.UserPool(this, 'KhayaUserPool', {
      selfSignUpEnabled: true,
      autoVerify: { email: false, phone: true },
      signInAliases: { phone: true, email: true },
      standardAttributes: {
        phoneNumber: { required: true, mutable: true },
        email: { required: false, mutable: true },
      },
      customAttributes: {
        role: new cognito.StringAttribute({ minLen: 1, maxLen: 20, mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'KhayaAppClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // ===== S3 Bucket for File Storage =====
    
    const storageBucket = new s3.Bucket(this, 'KhayaStorageBucket', {
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ===== Lambda Layer with Dependencies =====
    
    const depsLayer = new lambda.LayerVersion(this, 'DepsLayer', {
      code: lambda.Code.fromAsset('aws-lambda/layers'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'AWS SDK v3 and utility dependencies',
    });

    // ===== Lambda Functions =====
    
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('aws-lambda/handlers'),
      environment: {
        USERS_TABLE: usersTable.tableName,
        PROFILES_TABLE: profilesTable.tableName,
        JOBS_TABLE: jobsTable.tableName,
        BIDS_TABLE: bidsTable.tableName,
        LISTINGS_TABLE: listingsTable.tableName,
        REVIEWS_TABLE: reviewsTable.tableName,
        CREDITS_TABLE: creditsTable.tableName,
        REFERRALS_TABLE: referralsTable.tableName,
        STORIES_TABLE: storiesTable.tableName,
        STORAGE_BUCKET: storageBucket.bucketName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      layers: [depsLayer],
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      reservedConcurrentExecutions: 100,
    });

    // Grant permissions
    usersTable.grantReadWriteData(apiLambda);
    profilesTable.grantReadWriteData(apiLambda);
    jobsTable.grantReadWriteData(apiLambda);
    bidsTable.grantReadWriteData(apiLambda);
    listingsTable.grantReadWriteData(apiLambda);
    reviewsTable.grantReadWriteData(apiLambda);
    creditsTable.grantReadWriteData(apiLambda);
    referralsTable.grantReadWriteData(apiLambda);
    storiesTable.grantReadWriteData(apiLambda);
    storageBucket.grantReadWrite(apiLambda);

    // ===== API Gateway =====
    
    const api = new apigateway.RestApi(this, 'KhayaAPI', {
      restApiName: 'Khaya Service API',
      description: 'ProjectKhaya.co.za Marketplace API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
      },
    });

    const apiIntegration = new apigateway.LambdaIntegration(apiLambda);
    api.root.addProxy({ defaultIntegration: apiIntegration });

    // ===== Frontend S3 Bucket + CloudFront =====
    
    const frontendBucket = new s3.Bucket(this, 'KhayaFrontendBucket', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'KhayaCDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html',
      }],
      enabled: true,
    });

    // ===== EventBridge for Scheduled Tasks =====
    
    const dailyTasksLambda = new lambda.Function(this, 'DailyTasksLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'daily.handler',
      code: lambda.Code.fromAsset('aws-lambda/handlers'),
      environment: {
        JOBS_TABLE: jobsTable.tableName,
        LISTINGS_TABLE: listingsTable.tableName,
      },
      timeout: cdk.Duration.minutes(5),
    });

    jobsTable.grantReadWriteData(dailyTasksLambda);
    listingsTable.grantReadWriteData(dailyTasksLambda);

    const dailyRule = new events.Rule(this, 'DailyTasksRule', {
      schedule: events.Schedule.rate(cdk.Duration.days(1)),
      description: 'Run daily maintenance tasks',
    });
    dailyRule.addTarget(new targets.LambdaFunction(dailyTasksLambda));

    // ===== Outputs =====
    
    new cdk.CfnOutput(this, 'APIUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CDNUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'FrontendBucket', {
      value: frontendBucket.bucketName,
      description: 'S3 Frontend Bucket Name',
    });

    new cdk.CfnOutput(this, 'StorageBucket', {
      value: storageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
    });
  }
}
