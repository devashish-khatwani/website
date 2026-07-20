import { describe, expect, it } from "vitest";
import {
  approvedHubSpotDemoFields,
  getHubSpotDemoFormAvailability,
  hubSpotDemoConsentText,
  hubSpotFormsEmbedScriptSrc,
  hubSpotFormsRuntimeHostname,
  isHubSpotDemoRuntimeHost,
} from "../../src/lib/contact-form";

const validEnvironment = {
  PUBLIC_HUBSPOT_DEMO_FORM_ENABLED: "true",
  PUBLIC_HUBSPOT_PORTAL_ID: "123456",
  PUBLIC_HUBSPOT_DEMO_FORM_ID: "00000000-0000-4000-8000-000000000000",
  PUBLIC_HUBSPOT_REGION: "na1",
} as const;

describe("HubSpot demo form configuration", () => {
  it("keeps the native embed unavailable by default", () => {
    const availability = getHubSpotDemoFormAvailability({});

    expect(availability).toMatchObject({
      status: "unavailable",
      reason: "kill-switch-off",
    });
    expect(hubSpotFormsEmbedScriptSrc).toBe(
      "https://js.hsforms.net/forms/embed/v2.js",
    );
    expect(hubSpotFormsRuntimeHostname).toBe("www.glauxagent.com");
  });

  it("accepts bounded public HubSpot account identifiers without assuming region inventory", () => {
    expect(getHubSpotDemoFormAvailability(validEnvironment)).toMatchObject({
      status: "available",
      config: {
        region: "na1",
        portalId: "123456",
        formId: "00000000-0000-4000-8000-000000000000",
      },
    });
    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_REGION: "na2",
      }),
    ).toMatchObject({
      status: "available",
      config: { region: "na2" },
    });

    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_REGION: "NA2",
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-config" });
    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_REGION: "na2.example.com",
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-config" });
    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_PORTAL_ID: "portal-123",
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-config" });
    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_DEMO_FORM_ID: "not-a-form-id",
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-config" });
    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_PORTAL_ID: "123456",
        PUBLIC_HUBSPOT_DEMO_FORM_ID: "",
      }),
    ).toMatchObject({ status: "unavailable", reason: "invalid-config" });
    expect(
      getHubSpotDemoFormAvailability({
        ...validEnvironment,
        PUBLIC_HUBSPOT_DEMO_FORM_ENABLED: "TRUE",
      }),
    ).toMatchObject({ status: "unavailable", reason: "kill-switch-off" });
  });

  it("requires the exact production runtime hostname even with valid build config", () => {
    expect(isHubSpotDemoRuntimeHost("www.glauxagent.com")).toBe(true);
    expect(isHubSpotDemoRuntimeHost("glauxagent.com")).toBe(false);
    expect(isHubSpotDemoRuntimeHost("preview.glauxagent.com")).toBe(false);
    expect(isHubSpotDemoRuntimeHost("127.0.0.1")).toBe(false);
    expect(isHubSpotDemoRuntimeHost("localhost")).toBe(false);
  });

  it("documents only the approved account-side fields and consent text", () => {
    expect(approvedHubSpotDemoFields).toEqual([
      { label: "Work email", required: true },
      { label: "Name", required: true },
      { label: "Company", required: true },
      { label: "Role", required: true },
      { label: "Deployment stage", required: false },
      { label: "Expected users", required: false },
      { label: "Message", required: false },
      { label: "Consent", required: true, processingOnly: true },
    ]);
    expect(hubSpotDemoConsentText).toBe(
      "I agree that Glaux may store and process this information to respond to my demo request.",
    );
  });
});
