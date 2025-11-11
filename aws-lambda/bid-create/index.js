/**
 * Create Bid - Worker Only
 * Core workflow step 2: Worker submits bid on project
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { v4: uuidv4 } = require('uuid');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Create Bid Request:', JSON.stringify(event, null, 2));

  try {
    // Extract user from Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
    const userRole = event.requestContext.authorizer.claims['custom:role'];

    // Verify user is a Worker
    if (userRole !== 'Worker') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Only Workers can submit bids' })
      };
    }

    const body = JSON.parse(event.body);
    const {
      projectId,
      quote,
      timeline,
      proposal
    } = body;

    // Validation
    if (!projectId || !quote || !timeline || !proposal) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get worker profile
    const workerProfile = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE'
      }
    }));

    if (!workerProfile.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Worker profile not found' })
      };
    }

    // Check if worker is verified
    if (!workerProfile.Item.verified || !workerProfile.Item.idVerified) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Your profile must be verified before bidding',
          verificationStatus: {
            verified: workerProfile.Item.verified,
            idVerified: workerProfile.Item.idVerified
          }
        })
      };
    }

    // Get project to verify it exists and is open
    const project = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: 'METADATA'
      }
    }));

    if (!project.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Project not found' })
      };
    }

    if (project.Item.status !== 'OPEN') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Project is no longer accepting bids' })
      };
    }

    // Check if worker already bid on this project
    const existingBid = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: `BID#${userId}`
      }
    }));

    if (existingBid.Item) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'You have already bid on this project' })
      };
    }

    // Generate bid ID
    const bidId = `bid_${uuidv4().substring(0, 8)}`;
    const timestamp = new Date().toISOString();

    // Create bid record
    const bidItem = {
      PK: `PROJECT#${projectId}`,
      SK: `BID#${userId}`,
      entityType: 'BID',
      bidId,
      projectId,
      workerId: userId,
      workerName: workerProfile.Item.name,
      workerTrustScore: workerProfile.Item.trustScore || 0,
      workerCompletionRate: workerProfile.Item.completionRate || 0,
      quote,
      currency: 'ZAR',
      timeline,
      proposal,
      status: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI2PK: 'STATUS#PENDING',
      GSI2SK: `TIMESTAMP#${timestamp}`
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: bidItem
    }));

    console.log('Bid created:', bidId);

    // Increment project bid count
    await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `PROJECT#${projectId}`,
        SK: 'METADATA'
      },
      UpdateExpression: 'SET bidCount = bidCount + :inc, updatedAt = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':now': timestamp
      }
    }));

    console.log('Project bid count updated');

    // Notify buyer
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.NEW_BID_TOPIC,
      Message: JSON.stringify({
        projectId,
        bidId,
        workerId: userId,
        workerName: workerProfile.Item.name,
        quote,
        buyerId: project.Item.buyerId
      })
    }));

    console.log('Buyer notified');

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Bid submitted successfully!',
        bid: {
          bidId,
          projectId,
          quote,
          status: 'PENDING',
          createdAt: timestamp
        }
      })
    };

  } catch (error) {
    console.error('Create bid error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to submit bid' })
    };
  }
};
