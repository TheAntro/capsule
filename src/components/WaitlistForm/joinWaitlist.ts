"use server";

export type FormState = {
  success: boolean;
  message: string | null;
};

export async function joinWaitlist(prevState: FormState, formData: FormData) {
  const email = formData.get("email") as string;
  console.log(`Joining waitlist with email: ${email}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(email + " successfully joined the waitlist!");
  return { success: true, message: "Successfully joined the waitlist!" };
}
