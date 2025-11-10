#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KhayaStack } from '../lib/khaya-stack';

const app = new cdk.App();

new KhayaStack(app, 'KhayaStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.AWS_REGION || 'af-south-1', // Johannesburg for low latency to KZN
  },
  description: 'ProjectKhaya.co.za - Serverless Marketplace Infrastructure',
  tags: {
    Project: 'Khaya',
    Environment: 'Production',
    ManagedBy: 'AWS CDK',
  },
});

app.synth();
