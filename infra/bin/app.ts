#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KhayaStack } from '../lib/khaya-stack';

const app = new cdk.App();

// Get domain configuration from context or environment
const domainName = app.node.tryGetContext('domainName') || process.env.DOMAIN_NAME || 'projectkhaya.co.za';
const hostedZoneId = app.node.tryGetContext('hostedZoneId') || process.env.HOSTED_ZONE_ID;

new KhayaStack(app, 'KhayaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'us-east-1', // Using us-east-1 (af-south-1 requires opt-in)
  },
  description: 'ProjectKhaya.co.za - Serverless Marketplace Infrastructure',
  domainName,
  hostedZoneId,
  tags: {
    Project: 'Khaya',
    Environment: 'Production',
    ManagedBy: 'AWS CDK',
    Domain: domainName,
  },
});

app.synth();
