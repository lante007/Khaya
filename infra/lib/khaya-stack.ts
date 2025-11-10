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
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';

export interface KhayaStackProps extends cdk.StackProps {
  domainName?: string;
  hostedZoneId?: string;
}

export class KhayaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: KhayaStackProps) {
    super(scope, id, props);

    const domainName = props?.domainName || 'projectkhaya.co.za';
    const wwwDomainName = `www.${domainName}`;

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

    // ===== Lambda Functions =====
    
    const apiLambda = new lambda.Function(this, 'ApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../aws-lambda/dist'),
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
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
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

    // ===== Route 53 Hosted Zone (if provided) =====
    
    let hostedZone: route53.IHostedZone | undefined;
    if (props?.hostedZoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: props.hostedZoneId,
        zoneName: domainName,
      });
    }

    // ===== SSL Certificate for Custom Domain =====
    
    let certificate: acm.ICertificate | undefined;
    if (hostedZone) {
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: domainName,
        subjectAlternativeNames: [wwwDomainName],
        validation: acm.CertificateValidation.fromDns(hostedZone),
      });
    }

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

    // CloudFront Origin Access Identity for secure S3 access
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'OAI for Khaya frontend bucket',
    });

    frontendBucket.grantRead(originAccessIdentity);

    // CloudFront distribution with custom domain and SSL
    const distribution = new cloudfront.Distribution(this, 'KhayaCDN', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      enabled: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      // Add custom domain and certificate if available
      domainNames: certificate && hostedZone ? [domainName, wwwDomainName] : undefined,
      certificate: certificate || undefined,
    });

    // ===== Route 53 DNS Records =====
    
    if (hostedZone) {
      // A record for apex domain
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution)
        ),
      });

      // A record for www subdomain
      new route53.ARecord(this, 'WwwAliasRecord', {
        zone: hostedZone,
        recordName: wwwDomainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution)
        ),
      });
    }

    // ===== EventBridge for Scheduled Tasks =====
    
    const dailyTasksLambda = new lambda.Function(this, 'DailyTasksLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'daily.handler',
      code: lambda.Code.fromAsset('../aws-lambda/handlers'),
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
      exportName: 'KhayaAPIUrl',
    });

    new cdk.CfnOutput(this, 'CDNUrl', {
      value: certificate && hostedZone 
        ? `https://${domainName}` 
        : `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: 'KhayaCDNUrl',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
      exportName: 'KhayaDistributionId',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'KhayaUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'KhayaUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'FrontendBucket', {
      value: frontendBucket.bucketName,
      description: 'S3 Frontend Bucket Name',
      exportName: 'KhayaFrontendBucket',
    });

    new cdk.CfnOutput(this, 'StorageBucket', {
      value: storageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
      exportName: 'KhayaStorageBucket',
    });

    if (certificate) {
      new cdk.CfnOutput(this, 'CertificateArn', {
        value: certificate.certificateArn,
        description: 'SSL Certificate ARN',
        exportName: 'KhayaCertificateArn',
      });
    }

    if (hostedZone) {
      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: hostedZone.hostedZoneId,
        description: 'Route 53 Hosted Zone ID',
        exportName: 'KhayaHostedZoneId',
      });

      new cdk.CfnOutput(this, 'DomainName', {
        value: domainName,
        description: 'Custom Domain Name',
        exportName: 'KhayaDomainName',
      });
    }
  }
}
