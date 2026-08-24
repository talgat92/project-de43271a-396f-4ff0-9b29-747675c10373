import { createServerFn } from "@tanstack/react-start";

export interface LovableCredits {
  daily: { remaining: number; total: number };
  monthly: { remaining: number; total: number };
  updatedAt: string;
}

/**
 * Returns the current Lovable workspace credit snapshot.
 * NOTE: Lovable does not expose a public credit-balance API, so these values
 * are updated manually. Replace this with a real API call once one is available.
 */
export const getLovableCredits = createServerFn({ method: "GET" }).handler(
  async (): Promise<LovableCredits> => {
    return {
      daily: { remaining: 0, total: 5 },
      monthly: { remaining: 1.3, total: 10 },
      updatedAt: new Date().toISOString(),
    };
  }
);
