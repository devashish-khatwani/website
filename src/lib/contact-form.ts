type PublicEnvironment = Readonly<Record<string, string | undefined>>;

export const hubSpotFormsRuntimeHostname = "www.glauxagent.com";
export const hubSpotFormsEmbedScriptSrc =
  "https://js.hsforms.net/forms/embed/v2.js";
export const hubSpotDemoConsentText =
  "I agree that Glaux may store and process this information to respond to my demo request.";

export const approvedHubSpotDemoFields = [
  { label: "Work email", required: true },
  { label: "Name", required: true },
  { label: "Company", required: true },
  { label: "Role", required: true },
  { label: "Deployment stage", required: false },
  { label: "Expected users", required: false },
  { label: "Message", required: false },
  { label: "Consent", required: true, processingOnly: true },
] as const;

export type HubSpotDemoFormConfig = Readonly<{
  region: string;
  portalId: string;
  formId: string;
}>;

export type HubSpotDemoFormAvailability =
  | Readonly<{ status: "available"; config: HubSpotDemoFormConfig }>
  | Readonly<{
      status: "unavailable";
      reason: "kill-switch-off" | "invalid-config";
    }>;

const regionPattern = /^[a-z][a-z0-9]{1,15}$/u;
const portalIdPattern = /^[1-9]\d*$/u;
const formIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function getPublicValue(
  environment: PublicEnvironment,
  name: keyof PublicEnvironment,
): string {
  return environment[name]?.trim() ?? "";
}

export function isHubSpotDemoRuntimeHost(hostname: string): boolean {
  return hostname.toLowerCase() === hubSpotFormsRuntimeHostname;
}

export function getHubSpotDemoFormAvailability(
  environment: PublicEnvironment = process.env,
): HubSpotDemoFormAvailability {
  if (
    getPublicValue(environment, "PUBLIC_HUBSPOT_DEMO_FORM_ENABLED") !== "true"
  ) {
    return { status: "unavailable", reason: "kill-switch-off" };
  }

  const region = getPublicValue(environment, "PUBLIC_HUBSPOT_REGION");
  const portalId = getPublicValue(environment, "PUBLIC_HUBSPOT_PORTAL_ID");
  const formId = getPublicValue(
    environment,
    "PUBLIC_HUBSPOT_DEMO_FORM_ID",
  ).toLowerCase();

  if (
    !regionPattern.test(region) ||
    !portalIdPattern.test(portalId) ||
    !formIdPattern.test(formId)
  ) {
    return { status: "unavailable", reason: "invalid-config" };
  }

  return {
    status: "available",
    config: {
      region,
      portalId,
      formId,
    },
  };
}
