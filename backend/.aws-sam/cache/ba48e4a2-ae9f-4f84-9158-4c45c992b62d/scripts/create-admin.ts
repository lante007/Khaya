/**
 * Create Admin User Script
 * Run this to create the first super admin
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'af-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'khaya-prod';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('🔐 Create Super Admin User\n');

  const email = await question('Email: ');
  const name = await question('Name: ');
  const password = await question('Password (min 8 chars): ');

  if (!email || !name || !password) {
    console.error('❌ All fields are required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  console.log('\n🔄 Creating admin...');

  const adminId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = {
    PK: `ADMIN#${adminId}`,
    SK: 'PROFILE',
    adminId,
    email,
    name,
    role: 'super_admin',
    passwordHash,
    status: 'active',
    createdAt: new Date().toISOString(),
    GSI1PK: 'ADMIN',
    GSI1SK: email
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: admin,
      ConditionExpression: 'attribute_not_exists(PK)'
    }));

    console.log('\n✅ Super admin created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   ID: ${adminId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: super_admin`);
    console.log('\n🔑 Login at: /admin/login');
    console.log(`   Email: ${email}`);
    console.log(`   Password: [the password you entered]`);
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.error('❌ Admin with this ID already exists');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    process.exit(1);
  }

  rl.close();
}

createAdmin().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
