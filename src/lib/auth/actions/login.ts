"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword } from "../password";
import { createSessionCookie } from "../cookies";
import {
  serverActionError,
  toFieldErrors,
} from "@/lib/serverActions/serverActionError";
import type { ServerActionError } from "@/lib/serverActions/serverActionError";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginResult = { success: true } | ServerActionError;

export async function login(formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return serverActionError({
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Generic error to prevent user enumeration
  const invalidCredentialsError = serverActionError({
    formErrors: ["Invalid email or password"],
  });

  if (!user || !user.passwordHash) {
    return invalidCredentialsError;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return invalidCredentialsError;
  }

  await createSessionCookie(user.id);
  redirect("/");
}
