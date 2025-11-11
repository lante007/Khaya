/**
 * AWS Configuration
 * Centralized AWS client configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { S3Client } from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import { SESClient } from '@aws-sdk/client-ses';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || 'us-east-1';

// DynamoDB Client
const ddbClient = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  }
});

// Cognito Client
export const cognitoClient = new CognitoIdentityProviderClient({ region });

// S3 Client
export const s3Client = new S3Client({ region });

// SNS Client
export const snsClient = new SNSClient({ region });

// SES Client
export const sesClient = new SESClient({ region });

// EventBridge Client
export const eventBridgeClient = new EventBridgeClient({ region });

// Bedrock Client (for AI features)
export const bedrockClient = new BedrockRuntimeClient({ region });

// Environment Variables
export const config = {
  region,
  dynamoDbTable: process.env.DYNAMODB_TABLE || 'ProjectKhaya-dev',
  cognitoUserPoolId: process.env.USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  environment: process.env.ENVIRONMENT || 'dev'
};

export default config;
