export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    if (!oauthPortalUrl) {
      console.warn("VITE_OAUTH_PORTAL_URL is not defined in environment variables.");
      return "/#login-config-error";
    }

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId || "manus-app");
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("Failed to construct login URL:", error);
    return "/#login-url-error";
  }
};
