/**
 * Customer portal auth wire types. ASSUMPTION: the `/portal/auth/*` routes do
 * not exist in this worktree yet (built concurrently elsewhere) — shapes below
 * follow the staff auth pattern and architecture.md's "email/phone + password,
 * OTP verify, short-lived reset tokens". Confirm against the real DTOs once
 * that module lands.
 */

export interface CustomerAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface CustomerMeView {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface RegisterCustomerInput {
  email: string;
  password: string;
}

export interface VerifyCustomerInput {
  email: string;
  otp: string;
}

export interface LoginCustomerInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  password: string;
  otp: string;
}

export interface UpdateCustomerMeInput {
  displayName: string;
}
