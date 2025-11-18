import { useMemo } from "react";
import { NearIntents } from "@cookedbusiness/halfbaked-sdk";
import { ONECLICK_JWT_TOKEN, ONECLICK_API_BASE_URL } from "@/configs/env.config";

/**
 * Hook to initialize and use the NearIntents SDK
 * Creates a singleton instance of NearIntents for use throughout the app
 */
export const useNearIntents = () => {
  const nearIntents = useMemo(() => {
    if (!ONECLICK_JWT_TOKEN) {
      console.warn("ONECLICK_JWT_TOKEN is not set. NearIntents functionality will be limited.");
    }
    return new NearIntents(ONECLICK_JWT_TOKEN, ONECLICK_API_BASE_URL);
  }, []);

  return nearIntents;
};

