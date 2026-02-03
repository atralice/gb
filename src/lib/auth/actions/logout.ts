"use server";

import { deleteSessionCookie } from "../cookies";
import { redirect } from "next/navigation";

export async function logout(): Promise<never> {
  await deleteSessionCookie();
  redirect("/login");
}
