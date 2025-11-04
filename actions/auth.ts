"use server";

export async function isEmailAllowed(email: string): Promise<boolean> {
  // Get allowed users from environment variable
  const allowedUsersStr = process.env.ALLOWED_USERS || "";
  const allowedUsers = allowedUsersStr
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  // If ALLOWED_USERS is not set or empty, allow all users
  if (allowedUsers.length === 0) {
    return true;
  }

  // Check if email is in the allowed list
  return allowedUsers.includes(email.toLowerCase());
}

