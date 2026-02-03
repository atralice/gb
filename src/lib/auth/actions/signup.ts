"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword } from "../password";
import { createSessionCookie } from "../cookies";
import { serverActionError, ServerActionError } from "@/lib/serverActions";
import { redirect } from "next/navigation";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

type SignupResult = { success: true } | ServerActionError;

function toFieldErrors(
  errors: z.ZodFlattenedError<z.infer<typeof signupSchema>>["fieldErrors"]
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

export async function signup(formData: FormData): Promise<SignupResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return serverActionError({
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    });
  }

  const { email, password, name } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return serverActionError({
      fieldErrors: { email: ["An account with this email already exists"] },
    });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role: "athlete",
    },
  });

  await createSessionCookie(user.id);
  redirect("/");
}
