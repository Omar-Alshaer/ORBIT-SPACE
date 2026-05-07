import { auth } from "@/lib/firebase";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  withAuth?: boolean;
};

async function getAuthHeaders(withAuth: boolean): Promise<Record<string, string>> {
  if (!withAuth) {
    return {};
  }

  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Please sign in to continue.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function orbitApi<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const { headers = {}, withAuth = false, ...requestOptions } = options;
  const authHeaders = await getAuthHeaders(withAuth);
  const isFormData =
    typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeaders,
      ...headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      getFriendlyApiMessage(
        typeof payload?.error?.message === "string"
          ? payload.error.message
          : "",
      ),
    );
  }

  return (await response.json()) as TResponse;
}

function getFriendlyApiMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("token") ||
    lowerMessage.includes("authorization") ||
    lowerMessage.includes("credential")
  ) {
    return "Please sign in again to continue.";
  }

  if (
    lowerMessage.includes("cloudinary") ||
    lowerMessage.includes("upload failed")
  ) {
    return "We could not save this photo right now. Please try again.";
  }

  if (lowerMessage.includes("already completed")) {
    return "This mission is already complete for today.";
  }

  if (lowerMessage.includes("mission not found")) {
    return "This mission is not available anymore.";
  }

  if (lowerMessage.includes("challenge reward already claimed")) {
    return "This challenge reward was already claimed today.";
  }

  if (lowerMessage.includes("join the challenge first")) {
    return "Join the challenge before claiming the reward.";
  }

  if (lowerMessage.includes("challenge is not complete")) {
    return "Finish the challenge progress before claiming the reward.";
  }

  if (lowerMessage.includes("challenge not found")) {
    return "This challenge is not available anymore.";
  }

  return message || "Something went wrong. Please try again.";
}
