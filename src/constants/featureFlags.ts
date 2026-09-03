/**
 * Feature Flags Configuration for FiYDoc MVP.
 * Per Section 2 of FiYDoc Master Specification, all non-MVP features are
 * isolated behind feature flags defaulted OFF.
 */
export const FEATURE_FLAGS = {
  ENABLE_PHARMACY: false,
  ENABLE_LAB_TESTS: false,
  ENABLE_SOS_EMERGENCY: false,
  ENABLE_3D_BODY_VISUALIZATION: false,
  ENABLE_AI_OCR_SCANNER: false,
  ENABLE_PAYMENTS: false,
};
