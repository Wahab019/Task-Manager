import { Client, Account } from "appwrite";

/** Shared browser-side Appwrite client used by account operations. */
const client = new Client();

/** Public Appwrite API endpoint configured for the client bundle. */
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
/** Public Appwrite project identifier configured for the client bundle. */
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

/** Configure the client only when both required public settings are present. */
if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
}

/** Appwrite account service used for browser authentication operations. */
export const account = new Account(client);
/** Configured Appwrite client for consumers that need direct client access. */
export { client };

/**
 * Builds an authorization header from the current Appwrite session.
 *
 * The account lookup verifies that a session exists before creating a JWT.
 * Authentication failures are logged and return an empty object so callers
 * can still pass the result to request configuration without a thrown error.
 */
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
