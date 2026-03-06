import { Client, Account, Databases } from 'appwrite';
import { appwriteConfig } from '../constants/appwriteConfig';

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const appwriteAccount = new Account(client);
export const appwriteDatabases = new Databases(client);
export const appwriteDatabaseId = appwriteConfig.databaseId;

