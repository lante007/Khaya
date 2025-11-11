/**
 * Worker Signup Lambda
 * Complex signup with skills, bio, portfolio uploads
 */

const { CognitoIdentityProviderClient, SignUpCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const crypto = require('crypto');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

// Hash ID number for privacy
function hashIdNumber(idNumber) {
  return crypto.createHash('sha256').update(idNumber).digest('hex');
}

exports.handler = async (event) => {
  console.log('Worker Signup Request:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body);
    const { 
      name, 
      email, 
      phone, 
      password, 
      location, 
      skills,        // Array of skill strings
      bio,           // Text description
      idNumber,      // SA ID number
      portfolio      // Array of S3 URLs (uploaded via pre-signed URLs)
    } = body;

    // Validation
    if (!name || !email || !phone || !password || !location || !skills || !idNumber) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'At least one skill is required' })
      };
    }

    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+27${phone.replace(/^0/, '')}`;

    // Hash ID number for security
    const hashedId = hashIdNumber(idNumber);

    // Step 1: Create Cognito user
    const signUpParams = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'phone_number', Value: formattedPhone },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: 'Worker' },
        { Name: 'custom:location', Value: JSON.stringify(location) },
        { Name: 'custom:skills', Value: JSON.stringify(skills) },
        { Name: 'custom:verified', Value: 'false' }
      ]
    };

    const signUpResult = await cognitoClient.send(new SignUpCommand(signUpParams));
    const userId = signUpResult.UserSub;

    console.log('Cognito user created:', userId);

    // Step 2: Add user to Worker group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: 'Worker'
    }));

    console.log('User added to Worker group');

    // Step 3: Create DynamoDB profile
    const timestamp = new Date().toISOString();
    const profileItem = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      entityType: 'WORKER',
      userId,
      cognitoSub: userId,
      name,
      email,
      phone: formattedPhone,
      location,
      skills,
      bio: bio || '',
      idNumber: hashedId,
      verified: false,
      phoneVerified: false,
      idVerified: false,  // Requires admin approval
      trustScore: 0,
      totalJobs: 0,
      completionRate: 0,
      avgResponseTime: 0,
      portfolio: portfolio || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      GSI1PK: `ROLE#WORKER`,
      GSI1SK: `LOCATION#${location.city || 'Unknown'}#USER#${userId}`
    };

    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: profileItem
    }));

    console.log('DynamoDB profile created');

    // Step 4: Queue ID verification task for admin
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.VERIFICATION_QUEUE_TOPIC,
      Message: JSON.stringify({
        userId,
        name,
        email,
        role: 'Worker',
        verificationType: 'ID_VERIFICATION',
        idNumberHash: hashedId,
        portfolio
      })
    }));

    console.log('Verification task queued');

    // Step 5: Send welcome email
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.WELCOME_EMAIL_TOPIC,
      Message: JSON.stringify({
        email,
        name,
        role: 'Worker',
        userId
      })
    }));

    console.log('Welcome email queued');

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Worker account created! Your profile is pending verification.',
        userId,
        nextStep: 'VERIFY_EMAIL',
        verificationStatus: {
          email: 'PENDING',
          phone: 'PENDING',
          id: 'PENDING_ADMIN_REVIEW'
        }
      })
    };

  } catch (error) {
    console.error('Signup error:', error);

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
