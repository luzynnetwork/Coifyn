// NOTE: this client is hand-written for Phase 0. architecture.md/PROJECT-CONVENTIONS
// describe it as "generated from the API's OpenAPI spec" — that generation step
// (openapi-typescript/orval) is a documented follow-up, not done here.

export { configureApiClient, getApiClientConfig } from "./http/config";
export type { ApiClientConfig } from "./http/config";
export { baseFetch } from "./http/base-fetch";
export type { RequestOptions } from "./http/base-fetch";
export { ApiError, parseApiError } from "./http/errors";
export type { ProblemDetails } from "./http/errors";

export { login as staffLogin } from "./auth/login";
export { logout as staffLogout } from "./auth/logout";
export { refresh as staffRefresh } from "./auth/refresh";
export { getMe as getStaffMe, updateMe as updateStaffMe } from "./auth/me";
export type {
  AuthTokens,
  MeView,
  RegisterInput,
  LoginInput,
  RefreshInput,
  LogoutInput,
  UpdateMeInput,
} from "./auth/types";

export { register as registerCustomer } from "./customer-auth/register";
export { verify as verifyCustomer } from "./customer-auth/verify";
export { login as customerLogin } from "./customer-auth/login";
export { forgotPassword as forgotCustomerPassword } from "./customer-auth/forgot-password";
export { resetPassword as resetCustomerPassword } from "./customer-auth/reset-password";
export { getMe as getCustomerMe, updateMe as updateCustomerMe } from "./customer-auth/me";
export type {
  CustomerAuthTokens,
  CustomerMeView,
  RegisterCustomerInput,
  VerifyCustomerInput,
  LoginCustomerInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateCustomerMeInput,
} from "./customer-auth/types";
