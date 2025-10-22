"use server";

export async function joinWaitlist(formData: FormData) {
  const email = formData.get("email") as string;
  console.log(`Joining waitlist with email: ${email}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(email + " successfully joined the waitlist!");
}
