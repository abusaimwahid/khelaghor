export type SeedEnvironment = "development" | "staging" | "production";

type SeedEnvironmentInput = {
  APP_ENV?: string;
  NODE_ENV?: string;
  CREATE_SEED_ADMIN?: string;
};

export type SeedPolicy = {
  environment: SeedEnvironment;
  seedDevelopmentAdmin: boolean;
  seedOperationalAccess: boolean;
  seedSiteSettings: boolean;
  seedDevelopmentEmail: boolean;
};

export function resolveSeedPolicy(env: SeedEnvironmentInput): SeedPolicy {
  const environment: SeedEnvironment =
    env.APP_ENV === "staging"
      ? "staging"
      : env.APP_ENV === "production" || env.NODE_ENV === "production"
        ? "production"
        : "development";

  return {
    environment,
    seedDevelopmentAdmin: environment === "development",
    seedOperationalAccess: environment !== "staging",
    seedSiteSettings: environment !== "staging",
    seedDevelopmentEmail: environment === "development",
  };
}
