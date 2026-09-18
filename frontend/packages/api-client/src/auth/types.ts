/**
 * Staff auth wire types, mirrored from backend/src/auth/dto/auth.dto.ts and
 * backend/src/auth/application/{issue-session,get-me}.ts.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface MeView {
  id: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface UpdateMeInput {
  displayName: string;
}
