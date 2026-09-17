import { getApiClientConfig } from "@coifyn/api-client";

// ASSUMPTION: there is no dedicated customer logout endpoint yet in @coifyn/api-client
// (only register/verify/login/forgot-password/reset-password/me). Logout here just
// clears the locally held access token until a POST /portal/auth/logout call exists.
export async function logout(): Promise<void> {
  getApiClientConfig().setAccessToken(null);
}
