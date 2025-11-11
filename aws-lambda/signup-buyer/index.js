/**
 * Buyer Signup Lambda
 * Lightest signup flow - 5 fields only
 */

const { CognitoIdentityProviderClient, SignUpCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Buyer Signup Request:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { name, email, phone, password, location } = body;

    // Validation
    if (!name || !email || !phone || !password || !location) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Format phone number (ensure E.164 format)
    const formattedPhone = phone.startsWith('+') ? phone : `+27${phone.replace(/^0/, '')}`;

    // Step 1: Create Cognito user
    const signUpParams = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'phone_number', Value: formattedPhone },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: 'Buyer' },
        { Name: 'custom:location', Value: JSON.stringify(location) },
        { Name: 'custom:verified', Value: 'false' }
      ]
    };

    const signUpResult = await cognitoClient.send(new SignUpCommand(signUpParams));
    const userId = signUpResult.UserSub;

    console.log('Cognito user created:', userId);

    // Step 2: Add user to Buyer group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: 'Buyer'
    }));

    console.log('User added to Buyer group');

    // Step 3: Create DynamoDB profile
    const timestamp = new Date().toISOString();
    const profileItem = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      entityType: 'BUYER',
      userId,
      cognitoSub: userId,
      name,
      email,
      phone: formattedPhone,
      location,
      verified: false,
      phoneVerified: false,
      trustScore: 0,
      totalProjects: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `ROLE#BUYER`,
      GSI1SK: `LOCATION#${location.city || 'Unknown'}#USER#${userId}`
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: profileItem
    }));

    console.log('DynamoDB profile created');

    // Step 4: Send welcome email (via SNS → SES)
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.WELCOME_EMAIL_TOPIC,
      Message: JSON.stringify({
        email,
        name,
        role: 'Buyer',
        userId
      })
    }));

    console.log('Welcome email queued');

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Buyer account created! Please check your email to verify.',
        userId,
        nextStep: 'VERIFY_EMAIL'
      })
    };

  } catch (error) {
    console.error('Signup error:', error);

    // Handle specific Cognito errors
    if (error.name === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Email already registered' })
      };
    }

    if (error.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Password does not meet requirements' })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Signup failed. Please try again.' })
    };
  }
};
