"use server";

import { cookies } from "next/headers";
import { createSessionToken, findUserForLogin, verifyPassword } from "@/lib/auth";

export type LoginResult =
  | { success: true; redirectTarget: string }
  | { success: false; error: string };

const SESSION_COOKIE = "leafweb_session";

export async function loginServerAction(formData: FormData): Promise<LoginResult> {
  const loginStartedAt = performance.now();

  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { success: false, error: "missing-fields" };
    }

    if (!process.env.DATABASE_URL) {
      return { success: false, error: "db-unavailable" };
    }

    const lookupStartedAt = performance.now();
    const user = await findUserForLogin(email);
    const lookupMs = performance.now() - lookupStartedAt;

    if (!user || user.deletedAt) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[LOGIN] lookup=${lookupMs.toFixed(1)}ms total=${(performance.now() - loginStartedAt).toFixed(1)}ms`);
      }

      return { success: false, error: "invalid-credentials" };
    }

    const passwordStartedAt = performance.now();
    const valid = await verifyPassword(password, user.passwordHash);
    const passwordMs = performance.now() - passwordStartedAt;

    if (!valid) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[LOGIN] lookup=${lookupMs.toFixed(1)}ms password=${passwordMs.toFixed(1)}ms total=${(performance.now() - loginStartedAt).toFixed(1)}ms`,
        );
      }

      return { success: false, error: "invalid-credentials" };
    }

    const sessionStartedAt = performance.now();
    const token = await createSessionToken(user.id);
    const sessionMs = performance.now() - sessionStartedAt;

    const cookieStartedAt = performance.now();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const cookieMs = performance.now() - cookieStartedAt;
    const totalMs = performance.now() - loginStartedAt;

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[LOGIN] lookup=${lookupMs.toFixed(1)}ms password=${passwordMs.toFixed(1)}ms session=${sessionMs.toFixed(1)}ms cookie=${cookieMs.toFixed(1)}ms total=${totalMs.toFixed(1)}ms`,
      );
    }

       const redirectTarget = user.role?.slug === "client" ? "/portal" : "/admin";

    return { success: true, redirectTarget };
  } catch (error) {
    console.error(
      "LOGIN_ERROR",
      error instanceof Error ? error.message : String(error),
    );
    return { success: false, error: "server-error" };
  }
}

export async function logoutServerAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}