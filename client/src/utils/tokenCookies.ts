const ACCESS_COOKIE = "hermoso_access_token";
const REFRESH_COOKIE = "hermoso_refresh_token";

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "SameSite=Strict",
    location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
};

const getCookie = (name: string) => {
  const key = `${name}=`;
  const parts = document.cookie.split(";").map((item) => item.trim());
  const found = parts.find((item) => item.startsWith(key));
  if (!found) return "";
  return decodeURIComponent(found.slice(key.length));
};

const clearCookie = (name: string) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export const tokenCookies = {
  set(accessToken: string, refreshToken: string) {
    setCookie(ACCESS_COOKIE, accessToken, 7 * 24 * 60 * 60);
    setCookie(REFRESH_COOKIE, refreshToken, 30 * 24 * 60 * 60);
  },
  getAccessToken() {
    return getCookie(ACCESS_COOKIE);
  },
  getRefreshToken() {
    return getCookie(REFRESH_COOKIE);
  },
  clear() {
    clearCookie(ACCESS_COOKIE);
    clearCookie(REFRESH_COOKIE);
  },
};
