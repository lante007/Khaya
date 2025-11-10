import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface KhayaStackProps extends cdk.StackProps {
    domainName?: string;
    hostedZoneId?: string;
}
export declare class KhayaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: KhayaStackProps);
}
