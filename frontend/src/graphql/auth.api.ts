/**
 * Auth GraphQL API helpers for login, MFA, password reset, and profile fetch/update.
 */
import { apolloClient } from "./client";
import { formatGraphQLError } from "./error";
import {
  LOGIN_MUTATION,
  PROFILE_QUERY,
  REQUEST_PASSWORD_RESET_MUTATION,
  RESET_PASSWORD_MUTATION,
  TOGGLE_MFA_MUTATION,
  VERIFY_MFA_MUTATION,
} from "./auth.queries";
import { normalizeStoredUser, type StoredUser } from "../utils/auth";

export type LoginSuccessResponse = {
  access_token: string;
  user: StoredUser;
};

export type MfaChallengeResponse = {
  requires_mfa: true;
  mfaToken: string;
  message?: string;
};

export type LoginResponse = LoginSuccessResponse | MfaChallengeResponse;

/** Authenticates with email/password and returns either a session or MFA challenge. */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const { data } = await apolloClient.mutate<{
      login:
        | {
            __typename: "AuthSession";
            access_token: string;
            user: StoredUser;
          }
        | {
            __typename: "MfaChallenge";
            requires_mfa: true;
            mfaToken: string;
            message?: string | null;
          };
    }>({
      mutation: LOGIN_MUTATION,
      variables: { input: { email, password } },
    });

    const response = data?.login;
    if (!response) throw new Error("Unable to sign in right now.");

    if (response.__typename === "AuthSession") {
      return {
        access_token: response.access_token,
        user: normalizeStoredUser(response.user),
      };
    }

    return {
      requires_mfa: true,
      mfaToken: response.mfaToken,
      message: response.message ?? undefined,
    };
  } catch (error) {
    throw formatGraphQLError("Login", error);
  }
}

/** Verifies an MFA code using the challenge token and returns a session. */
export async function verifyMfaLogin(
  token: string,
  code: string,
): Promise<LoginSuccessResponse> {
  try {
    const { data } = await apolloClient.mutate<{
      verifyMfa: LoginSuccessResponse;
    }>({
      mutation: VERIFY_MFA_MUTATION,
      variables: { input: { token, code } },
    });
    const response = data?.verifyMfa;
    if (!response) throw new Error("Unable to verify MFA.");
    return {
      access_token: response.access_token,
      user: normalizeStoredUser(response.user),
    };
  } catch (error) {
    throw formatGraphQLError("MFA verification", error);
  }
}

/** Requests a password reset email for the provided address. */
export async function requestPasswordReset(email: string) {
  try {
    const { data } = await apolloClient.mutate<{
      requestPasswordReset?: { message?: string | null };
    }>({
      mutation: REQUEST_PASSWORD_RESET_MUTATION,
      variables: { input: { email } },
    });
    return (
      data?.requestPasswordReset?.message ??
      "If an account exists, a reset link has been sent."
    );
  } catch (error) {
    throw formatGraphQLError("Password reset request", error);
  }
}

/** Completes password reset using reset token and new password. */
export async function resetPassword(token: string, newPassword: string) {
  try {
    const { data } = await apolloClient.mutate<{
      resetPassword?: { message?: string | null };
    }>({
      mutation: RESET_PASSWORD_MUTATION,
      variables: { input: { token, newPassword } },
    });
    return data?.resetPassword?.message ?? "Password reset successfully.";
  } catch (error) {
    throw formatGraphQLError("Password reset", error);
  }
}

/** Fetches the authenticated user's profile. */
export async function fetchProfile(): Promise<StoredUser> {
  try {
    const { data } = await apolloClient.query<{ authProfile?: StoredUser }>({
      query: PROFILE_QUERY,
      fetchPolicy: "network-only",
    });
    const profile = data?.authProfile;
    if (!profile) throw new Error("Profile not found.");
    return normalizeStoredUser(profile);
  } catch (error) {
    throw formatGraphQLError("Profile", error);
  }
}

/** Enables or disables MFA and returns the updated profile. */
export async function toggleMfa(enabled: boolean): Promise<StoredUser> {
  try {
    const { data } = await apolloClient.mutate<{ toggleMfa?: StoredUser }>({
      mutation: TOGGLE_MFA_MUTATION,
      variables: { input: { enabled } },
    });
    const result = data?.toggleMfa;
    if (!result) throw new Error("Unable to update MFA.");
    return normalizeStoredUser(result);
  } catch (error) {
    throw formatGraphQLError("MFA settings", error);
  }
}
