"use server";

import { cookies } from "next/headers";
import { createSessionToken, findUserForLogin, verifyPassword } from "@/lib/auth";

export type LoginResult =
  | { success: true; redirectTarget: string }
  | { success: false; error: string };

const SESSION_COOKIE = "leafweb_session";

export async function loginServerAction(formData: FormData): Promise<LoginResult> {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { success: false, error: "missing-fields" };
    }

    if (!process.env.DATABASE_URL) {
      return { success: false, error: "db-unavailable" };
    }

    const user = await findUserForLogin(email);

    if (!user || user.deletedAt) {
      return { success: false, error: "invalid-credentials" };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "invalid-credentials" };
    }

    const token = await createSessionToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const redirectTarget = user.role?.slug === "client" ? "/portal" : "/admin";

    return { success: true, redirectTarget };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "server-error" };
  }
}

export async function logoutServerAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
