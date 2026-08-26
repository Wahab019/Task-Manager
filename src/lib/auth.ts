import { Client, Account } from "node-appwrite";
import { headers } from "next/headers";

/**
 * Resolves the authenticated Appwrite user from the current request.
 *
 * The API receives an Appwrite-generated JWT in the `Authorization` header,
 * validates it through the Appwrite SDK, and returns only the identity fields
 * required by server routes. Missing or invalid credentials return `null`.
 */
export async function getCurrentUser() {
  /** Request headers supplied by the current server-side route invocation. */
  const headersList = await headers();
  /** Bearer authorization value used to authenticate against Appwrite. */
  const authHeader = headersList.get("authorization");

  // Reject absent or non-Bearer credentials before constructing an Appwrite client.
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  /** JWT extracted from the authorization scheme prefix. */
  const jwt = authHeader.slice("Bearer ".length);

  try {
    // Validate the token through Appwrite's account service rather than decoding it locally.
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setJWT(jwt);

    const account = new Account(client);
    /** Account identity verified by Appwrite for the supplied JWT. */
    const user = await account.get();

    /** Minimal identity object consumed by authenticated API routes. */
    return {
      authUserId: user.$id,
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
}
