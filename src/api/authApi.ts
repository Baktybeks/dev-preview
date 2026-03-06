import { appwriteAccount } from '@api/appwriteClient';

export async function register(email: string, password: string, name?: string) {
  return appwriteAccount.create('unique()', email, password, name);
}

export async function login(email: string, password: string) {
  return appwriteAccount.createEmailPasswordSession(email, password);
}

export async function logout() {
  return appwriteAccount.deleteSession('current');
}

export async function getCurrentUser() {
  return appwriteAccount.get();
}

