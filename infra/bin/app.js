#!/usr/bin/env node
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const khaya_stack_1 = require("../lib/khaya-stack");
const app = new cdk.App();
// Get domain configuration from context or environment
const domainName = app.node.tryGetContext('domainName') || process.env.DOMAIN_NAME || 'projectkhaya.co.za';
const hostedZoneId = app.node.tryGetContext('hostedZoneId') || process.env.HOSTED_ZONE_ID;
new khaya_stack_1.KhayaStack(app, 'KhayaStack', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHVDQUFxQztBQUNyQyxpREFBbUM7QUFDbkMsb0RBQWdEO0FBRWhELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLHVEQUF1RDtBQUN2RCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxvQkFBb0IsQ0FBQztBQUMzRyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztBQUUxRixJQUFJLHdCQUFVLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRTtJQUNoQyxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVcsRUFBRSwrQ0FBK0M7S0FDL0Y7SUFDRCxXQUFXLEVBQUUsNERBQTREO0lBQ3pFLFVBQVU7SUFDVixZQUFZO0lBQ1osSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLE9BQU87UUFDaEIsV0FBVyxFQUFFLFlBQVk7UUFDekIsU0FBUyxFQUFFLFNBQVM7UUFDcEIsTUFBTSxFQUFFLFVBQVU7S0FDbkI7Q0FDRixDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjIS91c3IvYmluL2VudiBub2RlXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgS2hheWFTdGFjayB9IGZyb20gJy4uL2xpYi9raGF5YS1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbi8vIEdldCBkb21haW4gY29uZmlndXJhdGlvbiBmcm9tIGNvbnRleHQgb3IgZW52aXJvbm1lbnRcbmNvbnN0IGRvbWFpbk5hbWUgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdkb21haW5OYW1lJykgfHwgcHJvY2Vzcy5lbnYuRE9NQUlOX05BTUUgfHwgJ3Byb2plY3RraGF5YS5jby56YSc7XG5jb25zdCBob3N0ZWRab25lSWQgPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdob3N0ZWRab25lSWQnKSB8fCBwcm9jZXNzLmVudi5IT1NURURfWk9ORV9JRDtcblxubmV3IEtoYXlhU3RhY2soYXBwLCAnS2hheWFTdGFjaycsIHtcbiAgZW52OiB7XG4gICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbiAgICByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMScsIC8vIFVzaW5nIHVzLWVhc3QtMSAoYWYtc291dGgtMSByZXF1aXJlcyBvcHQtaW4pXG4gIH0sXG4gIGRlc2NyaXB0aW9uOiAnUHJvamVjdEtoYXlhLmNvLnphIC0gU2VydmVybGVzcyBNYXJrZXRwbGFjZSBJbmZyYXN0cnVjdHVyZScsXG4gIGRvbWFpbk5hbWUsXG4gIGhvc3RlZFpvbmVJZCxcbiAgdGFnczoge1xuICAgIFByb2plY3Q6ICdLaGF5YScsXG4gICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICBNYW5hZ2VkQnk6ICdBV1MgQ0RLJyxcbiAgICBEb21haW46IGRvbWFpbk5hbWUsXG4gIH0sXG59KTtcblxuYXBwLnN5bnRoKCk7XG4iXX0=