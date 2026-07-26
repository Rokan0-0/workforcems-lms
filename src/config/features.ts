export interface FeatureFlags {
  workforceMSMode: boolean;
  enableLMS: boolean;
  enableHMO: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  workforceMSMode: true,
  enableLMS: true,
  enableHMO: true,
};

export const getStoredFeatureFlags = (): FeatureFlags => {
  return DEFAULT_FEATURE_FLAGS;
};

export const setStoredFeatureFlags = (flags: FeatureFlags): void => {
  // No-op for locked WorkforceMS standalone mode
};
