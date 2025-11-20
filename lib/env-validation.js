// lib/env-validation.js
/**
 * Environment variable validation
 * Validates required environment variables on application startup
 */

const REQUIRED_ENV_VARS = {
  // Critical for production
  production: [
    "MONGODB_URI",
    "JWT_SECRET",
  ],
  // Development can be more lenient
  development: [
    "MONGODB_URI",
  ],
};

const OPTIONAL_ENV_VARS = [
  "NEXTAUTH_SECRET",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "RAZORPAY_PLAN_199",
  "RAZORPAY_PLAN_299",
  "GOOGLE_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "MAIL_USER",
  "MAIL_PASS",
  "NEXT_PUBLIC_RAZORPAY_KEY",
];

/**
 * Validate environment variables
 * @param {boolean} throwOnError - If true, throws error on missing required vars
 * @returns {Object} Validation result with missing vars and warnings
 */
export function validateEnv(throwOnError = false) {
  const env = process.env.NODE_ENV || "development";
  const isProduction = env === "production";
  
  const required = isProduction 
    ? REQUIRED_ENV_VARS.production 
    : REQUIRED_ENV_VARS.development;
  
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName] || process.env[varName].trim() === "") {
      missing.push(varName);
    }
  }

  // Check optional but recommended variables in production
  if (isProduction) {
    for (const varName of OPTIONAL_ENV_VARS) {
      if (!process.env[varName] || process.env[varName].trim() === "") {
        warnings.push(varName);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn("Optional environment variables not set (may affect functionality):");
    warnings.forEach((varName) => console.warn(`   - ${varName}`));
  }

  // Handle missing required variables
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables:\n${missing.map(v => `   - ${v}`).join("\n")}`;
    
    if (throwOnError) {
      throw new Error(errorMsg);
    } else {
      console.error(errorMsg);
      console.error("Application may not function correctly without these variables.");
    }
  } else {
    console.log("Environment variables validated successfully");
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate specific environment variable
 */
export function requireEnv(varName, defaultValue = null) {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    if (defaultValue !== null) {
      return defaultValue;
    }
    throw new Error(`Required environment variable ${varName} is not set`);
  }
  return value;
}

