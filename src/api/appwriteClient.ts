import { Client, Account, TablesDB } from 'appwrite';
import { appwriteConfig } from '../constants/appwriteConfig';

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const appwriteAccount = new Account(client);
export const appwriteTablesDB = new TablesDB(client);
export const appwriteDatabaseId = appwriteConfig.databaseId;

