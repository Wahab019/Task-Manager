import { Client, Account } from "appwrite";

const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);
export { client };

export async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    await account.get();
    const jwt = await account.createJWT();
    return { Authorization: `Bearer ${jwt.jwt}` };
  } catch (error) {
    console.error("Failed to create Appwrite auth header:", error);
    return {};
  }
}
