import type { FastifyReply } from "fastify";

const isProduction = process.env.NODE_ENV === "production";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" as const : "lax" as const,
  path: "/",
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  path: "/auth",
};

export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
) {
  reply.setCookie("access_token", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  });

  reply.setCookie("refresh_token", refreshToken, {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie("access_token", COOKIE_OPTIONS);
  reply.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);
}
