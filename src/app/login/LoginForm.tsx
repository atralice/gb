"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions/login";
import { isServerActionError, ServerActionError } from "@/lib/serverActions";
import Spinner from "@/components/ui/Spinner";

type FormState = ServerActionError | null;

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const result = await login(formData);
      if (isServerActionError(result)) {
        return result;
      }
      return null;
    },
    null
  );

  const emailError = state?.error?.fieldErrors?.email?.[0];
  const passwordError = state?.error?.fieldErrors?.password?.[0];
  const formError = state?.error?.formErrors?.[0];

  return (
    <form action={formAction} className="space-y-4">
      {formError && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {formError}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
        />
        {emailError && (
          <p className="text-red-600 text-sm mt-1">{emailError}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="********"
        />
        {passwordError && (
          <p className="text-red-600 text-sm mt-1">{passwordError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending && <Spinner size="sm" />}
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
