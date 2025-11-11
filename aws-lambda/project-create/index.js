/**
 * Create Project (Post Job) - Buyer Only
 * Core workflow step 1: Buyer posts a job
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { v4: uuidv4 } = require('uuid');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Create Project Request:', JSON.stringify(event, null, 2));

  try {
    // Extract user from Cognito authorizer
    const userId = event.requestContext.authorizer.claims.sub;
    const userRole = event.requestContext.authorizer.claims['custom:role'];

    // Verify user is a Buyer
    if (userRole !== 'Buyer') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Only Buyers can post projects' })
      };
    }

    const body = JSON.parse(event.body);
    const {
      title,
      description,
      category,
      skills,
      location,
      budget,
      timeline
    } = body;

    // Validation
    if (!title || !description || !category || !skills || !location || !budget) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Get buyer profile for name
    const buyerProfile = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE'
      }
    }));

    if (!buyerProfile.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Buyer profile not found' })
      };
    }

    // Generate project ID
    const projectId = `proj_${uuidv4().substring(0, 8)}`;
    const timestamp = new Date().toISOString();

    // Create project record
    const projectItem = {
      PK: `PROJECT#${projectId}`,
      SK: 'METADATA',
      entityType: 'PROJECT',
      projectId,
      buyerId: userId,
      buyerName: buyerProfile.Item.name,
      title,
      description,
      category,
      skills: Array.isArray(skills) ? skills : [skills],
      location,
      budget: {
        min: budget.min || 0,
        max: budget.max || 0,
        currency: budget.currency || 'ZAR'
      },
      timeline: timeline || {},
      status: 'OPEN',
      bidCount: 0,
      acceptedBidId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI2PK: 'STATUS#OPEN',
      GSI2SK: `TIMESTAMP#${timestamp}`
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: projectItem
    }));

    console.log('Project created:', projectId);

    // Notify matching workers via SNS
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.NEW_PROJECT_TOPIC,
      Message: JSON.stringify({
        projectId,
        title,
        category,
        skills,
        location,
        budget
      }),
      MessageAttributes: {
        category: { DataType: 'String', StringValue: category },
        location: { DataType: 'String', StringValue: location.city || 'Unknown' }
      }
    }));

    console.log('Workers notified');

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Project posted successfully!',
        project: {
          projectId,
          title,
          status: 'OPEN',
          createdAt: timestamp
        }
      })
    };

  } catch (error) {
    console.error('Create project error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to create project' })
    };
  }
};
