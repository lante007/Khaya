"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KhayaStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const acm = __importStar(require("aws-cdk-lib/aws-certificatemanager"));
const route53 = __importStar(require("aws-cdk-lib/aws-route53"));
const route53Targets = __importStar(require("aws-cdk-lib/aws-route53-targets"));
class KhayaStack extends cdk.Stack {
    constructor(scope, id, props) {
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
            code: lambda.Code.fromAsset('../aws-lambda/handlers'),
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
        // ===== Route 53 Hosted Zone (if provided) =====
        let hostedZone;
        if (props?.hostedZoneId) {
            hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
                hostedZoneId: props.hostedZoneId,
                zoneName: domainName,
            });
        }
        // ===== SSL Certificate for Custom Domain =====
        let certificate;
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
                target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
            });
            // A record for www subdomain
            new route53.ARecord(this, 'WwwAliasRecord', {
                zone: hostedZone,
                recordName: wwwDomainName,
                target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(distribution)),
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
exports.KhayaStack = KhayaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2hheWEtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJraGF5YS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsdURBQXlDO0FBQ3pDLHVFQUF5RDtBQUN6RCw0RUFBOEQ7QUFDOUQsbUVBQXFEO0FBQ3JELCtEQUFpRDtBQUNqRCx1RUFBeUQ7QUFDekQsaUVBQW1EO0FBQ25ELCtEQUFpRDtBQUNqRCx3RUFBMEQ7QUFHMUQsd0VBQTBEO0FBQzFELGlFQUFtRDtBQUNuRCxnRkFBa0U7QUFPbEUsTUFBYSxVQUFXLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1QjtRQUMvRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFVBQVUsR0FBRyxLQUFLLEVBQUUsVUFBVSxJQUFJLG9CQUFvQixDQUFDO1FBQzdELE1BQU0sYUFBYSxHQUFHLE9BQU8sVUFBVSxFQUFFLENBQUM7UUFFMUMsdUVBQXVFO1FBRXZFLE1BQU0sVUFBVSxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3hELFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO1lBQ2pFLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsTUFBTSxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCO1lBQ2xELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDdkMsbUJBQW1CLEVBQUUsSUFBSTtTQUMxQixDQUFDLENBQUM7UUFDSCxVQUFVLENBQUMsdUJBQXVCLENBQUM7WUFDakMsU0FBUyxFQUFFLFlBQVk7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Q0wsQ0FBQztJQUNILENBQUM7Q0FDRjtBQXJaRCxnQ0FxWkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgY29nbml0byBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY29nbml0byc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzM2RlcGxveSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudCc7XG5pbXBvcnQgKiBhcyBhY20gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgKiBhcyByb3V0ZTUzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzJztcbmltcG9ydCAqIGFzIHJvdXRlNTNUYXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXRhcmdldHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEtoYXlhU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZG9tYWluTmFtZT86IHN0cmluZztcbiAgaG9zdGVkWm9uZUlkPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgS2hheWFTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogS2hheWFTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCBkb21haW5OYW1lID0gcHJvcHM/LmRvbWFpbk5hbWUgfHwgJ3Byb2plY3RraGF5YS5jby56YSc7XG4gICAgY29uc3Qgd3d3RG9tYWluTmFtZSA9IGB3d3cuJHtkb21haW5OYW1lfWA7XG5cbiAgICAvLyA9PT09PSBEeW5hbW9EQiBUYWJsZXMgKFBheS1wZXItcmVxdWVzdCBmb3IgYXV0b25vbW91cyBzY2FsaW5nKSA9PT09PVxuICAgIFxuICAgIGNvbnN0IHVzZXJzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1VzZXJzVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFUyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgfSk7XG4gICAgdXNlcnNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdFbWFpbEluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZW1haWwnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIH0pO1xuICAgIHVzZXJzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnUGhvbmVJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Bob25lJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHByb2ZpbGVzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1Byb2ZpbGVzVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgc3RyZWFtOiBkeW5hbW9kYi5TdHJlYW1WaWV3VHlwZS5ORVdfQU5EX09MRF9JTUFHRVMsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG4gICAgcHJvZmlsZXNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdMb2NhdGlvbkluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnbG9jYXRpb24nLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAndHJ1c3RTY29yZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBqb2JzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0pvYnNUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFUyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICB9KTtcbiAgICBqb2JzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnU3RhdHVzSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdzdGF0dXMnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGJpZHNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQmlkc1RhYmxlJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdqb2JJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuICAgIGJpZHNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdKb2JJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2pvYklkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2Ftb3VudCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuTlVNQkVSIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBsaXN0aW5nc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdMaXN0aW5nc1RhYmxlJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuICAgIGxpc3RpbmdzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnQ2F0ZWdvcnlJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2NhdGVnb3J5JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2NyZWF0ZWRBdCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCByZXZpZXdzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1Jldmlld3NUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAncmV2aWV3ZWRJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY3JlZGl0c1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDcmVkaXRzVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3VzZXJJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVmZXJyYWxzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1JlZmVycmFsc1RhYmxlJywge1xuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuICAgIHJlZmVycmFsc1RhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ0NvZGVJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3JlZmVycmFsQ29kZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdG9yaWVzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1N0b3JpZXNUYWJsZScsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnY3JlYXRlZEF0JywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PSBDb2duaXRvIFVzZXIgUG9vbCBmb3IgQXV0aGVudGljYXRpb24gPT09PT1cbiAgICBcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdLaGF5YVVzZXJQb29sJywge1xuICAgICAgc2VsZlNpZ25VcEVuYWJsZWQ6IHRydWUsXG4gICAgICBhdXRvVmVyaWZ5OiB7IGVtYWlsOiBmYWxzZSwgcGhvbmU6IHRydWUgfSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHsgcGhvbmU6IHRydWUsIGVtYWlsOiB0cnVlIH0sXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgcGhvbmVOdW1iZXI6IHsgcmVxdWlyZWQ6IHRydWUsIG11dGFibGU6IHRydWUgfSxcbiAgICAgICAgZW1haWw6IHsgcmVxdWlyZWQ6IGZhbHNlLCBtdXRhYmxlOiB0cnVlIH0sXG4gICAgICB9LFxuICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xuICAgICAgICByb2xlOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoeyBtaW5MZW46IDEsIG1heExlbjogMjAsIG11dGFibGU6IHRydWUgfSksXG4gICAgICB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiBmYWxzZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuUEhPTkVfT05MWV9XSVRIT1VUX01GQSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHVzZXJQb29sQ2xpZW50ID0gbmV3IGNvZ25pdG8uVXNlclBvb2xDbGllbnQodGhpcywgJ0toYXlhQXBwQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2wsXG4gICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgICB1c2VyU3JwOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGdlbmVyYXRlU2VjcmV0OiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vID09PT09IFMzIEJ1Y2tldCBmb3IgRmlsZSBTdG9yYWdlID09PT09XG4gICAgXG4gICAgY29uc3Qgc3RvcmFnZUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0toYXlhU3RvcmFnZUJ1Y2tldCcsIHtcbiAgICAgIGNvcnM6IFt7XG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuR0VULCBzMy5IdHRwTWV0aG9kcy5QVVQsIHMzLkh0dHBNZXRob2RzLlBPU1RdLFxuICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXG4gICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgIH1dLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT0gTGFtYmRhIEZ1bmN0aW9ucyA9PT09PVxuICAgIFxuICAgIGNvbnN0IGFwaUxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FwaUxhbWJkYScsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9hd3MtbGFtYmRhL2hhbmRsZXJzJyksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBVU0VSU19UQUJMRTogdXNlcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFBST0ZJTEVTX1RBQkxFOiBwcm9maWxlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgSk9CU19UQUJMRTogam9ic1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQklEU19UQUJMRTogYmlkc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgTElTVElOR1NfVEFCTEU6IGxpc3RpbmdzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBSRVZJRVdTX1RBQkxFOiByZXZpZXdzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBDUkVESVRTX1RBQkxFOiBjcmVkaXRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBSRUZFUlJBTFNfVEFCTEU6IHJlZmVycmFsc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgU1RPUklFU19UQUJMRTogc3Rvcmllc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgU1RPUkFHRV9CVUNLRVQ6IHN0b3JhZ2VCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgVVNFUl9QT09MX0lEOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgICBVU0VSX1BPT0xfQ0xJRU5UX0lEOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIHJlc2VydmVkQ29uY3VycmVudEV4ZWN1dGlvbnM6IDEwMCxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgdXNlcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBpTGFtYmRhKTtcbiAgICBwcm9maWxlc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGEpO1xuICAgIGpvYnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBpTGFtYmRhKTtcbiAgICBiaWRzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFwaUxhbWJkYSk7XG4gICAgbGlzdGluZ3NUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBpTGFtYmRhKTtcbiAgICByZXZpZXdzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFwaUxhbWJkYSk7XG4gICAgY3JlZGl0c1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGEpO1xuICAgIHJlZmVycmFsc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhcGlMYW1iZGEpO1xuICAgIHN0b3JpZXNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXBpTGFtYmRhKTtcbiAgICBzdG9yYWdlQnVja2V0LmdyYW50UmVhZFdyaXRlKGFwaUxhbWJkYSk7XG5cbiAgICAvLyA9PT09PSBBUEkgR2F0ZXdheSA9PT09PVxuICAgIFxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0toYXlhQVBJJywge1xuICAgICAgcmVzdEFwaU5hbWU6ICdLaGF5YSBTZXJ2aWNlIEFQSScsXG4gICAgICBkZXNjcmlwdGlvbjogJ1Byb2plY3RLaGF5YS5jby56YSBNYXJrZXRwbGFjZSBBUEknLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJ10sXG4gICAgICB9LFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6ICdwcm9kJyxcbiAgICAgICAgdGhyb3R0bGluZ0J1cnN0TGltaXQ6IDEwMDAsXG4gICAgICAgIHRocm90dGxpbmdSYXRlTGltaXQ6IDUwMCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFwaUxhbWJkYSk7XG4gICAgYXBpLnJvb3QuYWRkUHJveHkoeyBkZWZhdWx0SW50ZWdyYXRpb246IGFwaUludGVncmF0aW9uIH0pO1xuXG4gICAgLy8gPT09PT0gUm91dGUgNTMgSG9zdGVkIFpvbmUgKGlmIHByb3ZpZGVkKSA9PT09PVxuICAgIFxuICAgIGxldCBob3N0ZWRab25lOiByb3V0ZTUzLklIb3N0ZWRab25lIHwgdW5kZWZpbmVkO1xuICAgIGlmIChwcm9wcz8uaG9zdGVkWm9uZUlkKSB7XG4gICAgICBob3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Ib3N0ZWRab25lQXR0cmlidXRlcyh0aGlzLCAnSG9zdGVkWm9uZScsIHtcbiAgICAgICAgaG9zdGVkWm9uZUlkOiBwcm9wcy5ob3N0ZWRab25lSWQsXG4gICAgICAgIHpvbmVOYW1lOiBkb21haW5OYW1lLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gPT09PT0gU1NMIENlcnRpZmljYXRlIGZvciBDdXN0b20gRG9tYWluID09PT09XG4gICAgXG4gICAgbGV0IGNlcnRpZmljYXRlOiBhY20uSUNlcnRpZmljYXRlIHwgdW5kZWZpbmVkO1xuICAgIGlmIChob3N0ZWRab25lKSB7XG4gICAgICBjZXJ0aWZpY2F0ZSA9IG5ldyBhY20uQ2VydGlmaWNhdGUodGhpcywgJ0NlcnRpZmljYXRlJywge1xuICAgICAgICBkb21haW5OYW1lOiBkb21haW5OYW1lLFxuICAgICAgICBzdWJqZWN0QWx0ZXJuYXRpdmVOYW1lczogW3d3d0RvbWFpbk5hbWVdLFxuICAgICAgICB2YWxpZGF0aW9uOiBhY20uQ2VydGlmaWNhdGVWYWxpZGF0aW9uLmZyb21EbnMoaG9zdGVkWm9uZSksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyA9PT09PSBGcm9udGVuZCBTMyBCdWNrZXQgKyBDbG91ZEZyb250ID09PT09XG4gICAgXG4gICAgY29uc3QgZnJvbnRlbmRCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdLaGF5YUZyb250ZW5kQnVja2V0Jywge1xuICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgIHdlYnNpdGVFcnJvckRvY3VtZW50OiAnaW5kZXguaHRtbCcsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IG5ldyBzMy5CbG9ja1B1YmxpY0FjY2Vzcyh7XG4gICAgICAgIGJsb2NrUHVibGljQWNsczogZmFsc2UsXG4gICAgICAgIGJsb2NrUHVibGljUG9saWN5OiBmYWxzZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogZmFsc2UsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogZmFsc2UsXG4gICAgICB9KSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkRnJvbnQgT3JpZ2luIEFjY2VzcyBJZGVudGl0eSBmb3Igc2VjdXJlIFMzIGFjY2Vzc1xuICAgIGNvbnN0IG9yaWdpbkFjY2Vzc0lkZW50aXR5ID0gbmV3IGNsb3VkZnJvbnQuT3JpZ2luQWNjZXNzSWRlbnRpdHkodGhpcywgJ09BSScsIHtcbiAgICAgIGNvbW1lbnQ6ICdPQUkgZm9yIEtoYXlhIGZyb250ZW5kIGJ1Y2tldCcsXG4gICAgfSk7XG5cbiAgICBmcm9udGVuZEJ1Y2tldC5ncmFudFJlYWQob3JpZ2luQWNjZXNzSWRlbnRpdHkpO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBkaXN0cmlidXRpb24gd2l0aCBjdXN0b20gZG9tYWluIGFuZCBTU0xcbiAgICBjb25zdCBkaXN0cmlidXRpb24gPSBuZXcgY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ0toYXlhQ0ROJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4oZnJvbnRlbmRCdWNrZXQsIHtcbiAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICAgICAgfSksXG4gICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgICAgY29tcHJlc3M6IHRydWUsXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICAgIGNhY2hlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQ2FjaGVkTWV0aG9kcy5DQUNIRV9HRVRfSEVBRF9PUFRJT05TLFxuICAgICAgfSxcbiAgICAgIGFkZGl0aW9uYWxCZWhhdmlvcnM6IHtcbiAgICAgICAgJy9hcGkvKic6IHtcbiAgICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLlJlc3RBcGlPcmlnaW4oYXBpKSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5IVFRQU19PTkxZLFxuICAgICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfRElTQUJMRUQsXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfQUxMLFxuICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IGNsb3VkZnJvbnQuT3JpZ2luUmVxdWVzdFBvbGljeS5BTExfVklFV0VSLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDA0LFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwMyxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIHByaWNlQ2xhc3M6IGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsXG4gICAgICBodHRwVmVyc2lvbjogY2xvdWRmcm9udC5IdHRwVmVyc2lvbi5IVFRQMl9BTkRfMyxcbiAgICAgIG1pbmltdW1Qcm90b2NvbFZlcnNpb246IGNsb3VkZnJvbnQuU2VjdXJpdHlQb2xpY3lQcm90b2NvbC5UTFNfVjFfMl8yMDIxLFxuICAgICAgLy8gQWRkIGN1c3RvbSBkb21haW4gYW5kIGNlcnRpZmljYXRlIGlmIGF2YWlsYWJsZVxuICAgICAgZG9tYWluTmFtZXM6IGNlcnRpZmljYXRlICYmIGhvc3RlZFpvbmUgPyBbZG9tYWluTmFtZSwgd3d3RG9tYWluTmFtZV0gOiB1bmRlZmluZWQsXG4gICAgICBjZXJ0aWZpY2F0ZTogY2VydGlmaWNhdGUgfHwgdW5kZWZpbmVkLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT0gUm91dGUgNTMgRE5TIFJlY29yZHMgPT09PT1cbiAgICBcbiAgICBpZiAoaG9zdGVkWm9uZSkge1xuICAgICAgLy8gQSByZWNvcmQgZm9yIGFwZXggZG9tYWluXG4gICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdBbGlhc1JlY29yZCcsIHtcbiAgICAgICAgem9uZTogaG9zdGVkWm9uZSxcbiAgICAgICAgcmVjb3JkTmFtZTogZG9tYWluTmFtZSxcbiAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMoXG4gICAgICAgICAgbmV3IHJvdXRlNTNUYXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKVxuICAgICAgICApLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEEgcmVjb3JkIGZvciB3d3cgc3ViZG9tYWluXG4gICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdXd3dBbGlhc1JlY29yZCcsIHtcbiAgICAgICAgem9uZTogaG9zdGVkWm9uZSxcbiAgICAgICAgcmVjb3JkTmFtZTogd3d3RG9tYWluTmFtZSxcbiAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMoXG4gICAgICAgICAgbmV3IHJvdXRlNTNUYXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQoZGlzdHJpYnV0aW9uKVxuICAgICAgICApLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gPT09PT0gRXZlbnRCcmlkZ2UgZm9yIFNjaGVkdWxlZCBUYXNrcyA9PT09PVxuICAgIFxuICAgIGNvbnN0IGRhaWx5VGFza3NMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdEYWlseVRhc2tzTGFtYmRhJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnZGFpbHkuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2F3cy1sYW1iZGEvaGFuZGxlcnMnKSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEpPQlNfVEFCTEU6IGpvYnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIExJU1RJTkdTX1RBQkxFOiBsaXN0aW5nc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICB9KTtcblxuICAgIGpvYnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZGFpbHlUYXNrc0xhbWJkYSk7XG4gICAgbGlzdGluZ3NUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoZGFpbHlUYXNrc0xhbWJkYSk7XG5cbiAgICBjb25zdCBkYWlseVJ1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ0RhaWx5VGFza3NSdWxlJywge1xuICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKGNkay5EdXJhdGlvbi5kYXlzKDEpKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUnVuIGRhaWx5IG1haW50ZW5hbmNlIHRhc2tzJyxcbiAgICB9KTtcbiAgICBkYWlseVJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGRhaWx5VGFza3NMYW1iZGEpKTtcblxuICAgIC8vID09PT09IE91dHB1dHMgPT09PT1cbiAgICBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQVBJVXJsJywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCcsXG4gICAgICBleHBvcnROYW1lOiAnS2hheWFBUElVcmwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NETlVybCcsIHtcbiAgICAgIHZhbHVlOiBjZXJ0aWZpY2F0ZSAmJiBob3N0ZWRab25lIFxuICAgICAgICA/IGBodHRwczovLyR7ZG9tYWluTmFtZX1gIFxuICAgICAgICA6IGBodHRwczovLyR7ZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbkRvbWFpbk5hbWV9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gVVJMJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdLaGF5YUNETlVybCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBJRCAoZm9yIGNhY2hlIGludmFsaWRhdGlvbiknLFxuICAgICAgZXhwb3J0TmFtZTogJ0toYXlhRGlzdHJpYnV0aW9uSWQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XG4gICAgICB2YWx1ZTogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogJ0toYXlhVXNlclBvb2xJZCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogJ0toYXlhVXNlclBvb2xDbGllbnRJZCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRnJvbnRlbmRCdWNrZXQnLCB7XG4gICAgICB2YWx1ZTogZnJvbnRlbmRCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgRnJvbnRlbmQgQnVja2V0IE5hbWUnLFxuICAgICAgZXhwb3J0TmFtZTogJ0toYXlhRnJvbnRlbmRCdWNrZXQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1N0b3JhZ2VCdWNrZXQnLCB7XG4gICAgICB2YWx1ZTogc3RvcmFnZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTMyBTdG9yYWdlIEJ1Y2tldCBOYW1lJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdLaGF5YVN0b3JhZ2VCdWNrZXQnLFxuICAgIH0pO1xuXG4gICAgaWYgKGNlcnRpZmljYXRlKSB7XG4gICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2VydGlmaWNhdGVBcm4nLCB7XG4gICAgICAgIHZhbHVlOiBjZXJ0aWZpY2F0ZS5jZXJ0aWZpY2F0ZUFybixcbiAgICAgICAgZGVzY3JpcHRpb246ICdTU0wgQ2VydGlmaWNhdGUgQVJOJyxcbiAgICAgICAgZXhwb3J0TmFtZTogJ0toYXlhQ2VydGlmaWNhdGVBcm4nLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGhvc3RlZFpvbmUpIHtcbiAgICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdIb3N0ZWRab25lSWQnLCB7XG4gICAgICAgIHZhbHVlOiBob3N0ZWRab25lLmhvc3RlZFpvbmVJZCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdSb3V0ZSA1MyBIb3N0ZWQgWm9uZSBJRCcsXG4gICAgICAgIGV4cG9ydE5hbWU6ICdLaGF5YUhvc3RlZFpvbmVJZCcsXG4gICAgICB9KTtcblxuICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RvbWFpbk5hbWUnLCB7XG4gICAgICAgIHZhbHVlOiBkb21haW5OYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0N1c3RvbSBEb21haW4gTmFtZScsXG4gICAgICAgIGV4cG9ydE5hbWU6ICdLaGF5YURvbWFpbk5hbWUnLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG4iXX0=