/**
 * Database Helper Functions
 * DynamoDB operations with single-table design
 */

import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, config } from '../config/aws.js';

const TABLE_NAME = config.dynamoDbTable;

export interface DbItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

/**
 * Put item in DynamoDB
 */
export async function putItem(item: DbItem) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  });
  
  await docClient.send(command);
  return item;
}

/**
 * Get item from DynamoDB
 */
export async function getItem(key: { PK: string; SK: string }) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: key
  });
  
  const result = await docClient.send(command);
  return result.Item;
}

/**
 * Query items by PK
 */
export async function queryByPK(PK: string, SKPrefix?: string) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: SKPrefix 
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk',
    ExpressionAttributeValues: SKPrefix
      ? { ':pk': PK, ':sk': SKPrefix }
      : { ':pk': PK }
  });
  
  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Query items by GSI
 */
export async function queryByGSI(
  indexName: string,
  pkName: string,
  pkValue: string,
  skName?: string,
  skValue?: string
) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: skName && skValue
      ? `${pkName} = :pk AND ${skName} = :sk`
      : `${pkName} = :pk`,
    ExpressionAttributeValues: skName && skValue
      ? { ':pk': pkValue, ':sk': skValue }
      : { ':pk': pkValue }
  });
  
  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Update item in DynamoDB
 */
export async function updateItem(
  key: { PK: string; SK: string },
  updates: Record<string, any>
) {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  
  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });
  
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: key,
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  });
  
  const result = await docClient.send(command);
  return result.Attributes;
}

/**
 * Delete item from DynamoDB
 */
export async function deleteItem(key: { PK: string; SK: string }) {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: key
  });
  
  await docClient.send(command);
  return true;
}

/**
 * Query items with custom parameters
 */
export async function queryItems(params: any) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    ...params
  });
  
  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp
 */
export function timestamp(): string {
  return new Date().toISOString();
}
