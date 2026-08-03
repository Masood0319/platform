export function getCookieBaseOptions() {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    path: "/",
  };
}

export function getTokenCookieOptions(maxAgeSeconds) {
  return {
    ...getCookieBaseOptions(),
    maxAge: maxAgeSeconds,
  };
}

export function getPendingEmailCookieOptions(maxAgeSeconds) {
  return {
    ...getCookieBaseOptions(),
    maxAge: maxAgeSeconds,
  };
}

export function getExpiredCookieOptions() {
  return {
    ...getCookieBaseOptions(),
    maxAge: 0,
  };
}
