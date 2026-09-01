import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { scryptSync, timingSafeEqual } from "node:crypto";

import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";
import { prisma } from "../../db";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleSlug: string;
  permissions: PermissionKey[];
  clientId?: string;
  teamMemberId?: string;
};

const SESSION_COOKIE = "leafweb_session";

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required in production. Configure a secure application secret before deployment.");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  providedPassword: string,
  storedHash: string,
): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(providedPassword, storedHash);
  }

  const legacyParts = storedHash.split("$");
  if (legacyParts.length !== 3 || legacyParts[0] !== "scrypt") {
    return false;
  }

  const [, salt, expectedHex] = legacyParts;
  if (!/^[a-f0-9]+$/i.test(salt) || !/^[a-f0-9]{128}$/i.test(expectedHex)) {
    return false;
  }

  const actual = scryptSync(providedPassword, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expectedHex, "hex"));
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());

  return token;
}

export async function findUserForLogin(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      deletedAt: true,
      role: { select: { slug: true } },
    },
  });
}

export async function verifySessionToken(token: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, getAuthSecret());
  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid session token");
  }

  return { sub: payload.sub };
}

export async function readSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  return value ?? null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const token = await readSessionCookie();
    if (!token) return null;

    const session = await verifySessionToken(token);
    if (!process.env.DATABASE_URL) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        deletedAt: true,
        client: { select: { id: true } },
        teamMember: { select: { id: true } },
        role: {
          select: {
            slug: true,
            permissions: {
              select: {
                permission: { select: { key: true } },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt) return null;

    const permissions = user.role.permissions.map(
      (entry: { permission: { key: string } }) => entry.permission.key as PermissionKey,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleSlug: user.role.slug,
      permissions,
      clientId: user.client?.id,
      teamMemberId: user.teamMember?.id,
    };
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const user = await getCurrentAuthenticatedUser();
  return user;
}

export async function canUserAccess(user: AuthenticatedUser, required: PermissionKey): Promise<boolean> {
  return user.permissions.includes(required) || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS);
}
