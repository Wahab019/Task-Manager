import { Client, Account } from "node-appwrite";
import { headers } from "next/headers";

// Returns the currently authenticated Appwrite user or null when no session exists.
// Appwrite's built-in jwt flow: "appwrite jwt auth" used rather than a generic JWT library. the JWT is being created and consumed by Appwrite SDKs, not by a standalone package like jsonwebtoken
export async function getCurrentUser() {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const jwt = authHeader.slice("Bearer ".length);

  try {
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setJWT(jwt);

    const account = new Account(client);
    const user = await account.get();

    return {
      authUserId: user.$id,
      name: user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
}
