import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export const redirectTo = makeRedirectUri();

export const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) throw new Error(errorCode);

  if (params.error) {
    const errorDescription = params.error_description
      ? decodeURIComponent(params.error_description.replace(/\+/g, " "))
      : params.error;
    throw new Error(errorDescription);
  }

  const { access_token, refresh_token, token_hash, type } = params;

  if (token_hash) {
    // "signup" from the URL must be remapped to "email" for verifyOtp
    const otpType = type === "signup" ? "email" : ((type as any) ?? "email");

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType,
    });
    if (error) throw error;
    return;
  }

  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};
