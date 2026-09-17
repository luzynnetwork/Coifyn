// NOTE: this client is hand-written for Phase 0. architecture.md/PROJECT-CONVENTIONS
// describe it as "generated from the API's OpenAPI spec" — that generation step
// (openapi-typescript/orval) is a documented follow-up, not done here.

export { configureApiClient, getApiClientConfig } from "./http/config.js";
export type { ApiClientConfig } from "./http/config.js";
export { baseFetch } from "./http/base-fetch.js";
export type { RequestOptions } from "./http/base-fetch.js";
export { ApiError, parseApiError } from "./http/errors.js";
export type { ProblemDetails } from "./http/errors.js";

export { login as staffLogin } from "./auth/login.js";
export { logout as staffLogout } from "./auth/logout.js";
export { refresh as staffRefresh } from "./auth/refresh.js";
export { getMe as getStaffMe, updateMe as updateStaffMe } from "./auth/me.js";
export type {
  AuthTokens,
  MeView,
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
  UpdateMeInput,
} from "./auth/types.js";

export { register as registerCustomer } from "./customer-auth/register.js";
export { verify as verifyCustomer } from "./customer-auth/verify.js";
export { login as customerLogin } from "./customer-auth/login.js";
export { forgotPassword as forgotCustomerPassword } from "./customer-auth/forgot-password.js";
export { resetPassword as resetCustomerPassword } from "./customer-auth/reset-password.js";
export { getMe as getCustomerMe, updateMe as updateCustomerMe } from "./customer-auth/me.js";
export type {
  CustomerAuthTokens,
  CustomerMeView,
  RegisterCustomerInput,
  VerifyCustomerInput,
  LoginCustomerInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateCustomerMeInput,
} from "./customer-auth/types.js";
