import { describe, expect, it } from "vitest";
import {
  contactFormFields,
  contactFormProcessorEnabled,
  contactSubmissionStateCopy,
  deploymentStageOptions,
  expectedUsersOptions,
  firstInvalidContactField,
  governanceConcernOptions,
  inputFromFormData,
  submitContactForm,
  validateContactForm,
  type ContactSubmissionState,
} from "../../src/lib/contact-form";

const validInput = {
  workEmail: "Operator@Example.COM",
  name: "  Ada  Lovelace ",
  company: " Example Company ",
  role: " Security lead ",
  deploymentStage: deploymentStageOptions[0],
  expectedUsers: expectedUsersOptions[1],
  governanceConcern: governanceConcernOptions[0],
  message: "We want to understand approval paths.",
  consent: true,
} as const;

describe("contact form validation contract", () => {
  it("keeps the PRD field list explicit and ordered", () => {
    expect(contactFormFields).toEqual([
      "workEmail",
      "name",
      "company",
      "role",
      "deploymentStage",
      "expectedUsers",
      "governanceConcern",
      "message",
      "consent",
    ]);
  });

  it("normalizes a valid contact form submission", () => {
    const result = validateContactForm(validInput);

    expect(result.status).toBe("valid");
    expect(result).toMatchObject({
      submission: {
        workEmail: "operator@example.com",
        name: "Ada Lovelace",
        company: "Example Company",
        role: "Security lead",
        deploymentStage: deploymentStageOptions[0],
        expectedUsers: expectedUsersOptions[1],
        governanceConcern: governanceConcernOptions[0],
        message: "We want to understand approval paths.",
        consent: true,
      },
    });
  });

  it("returns field-specific validation errors and first invalid field", () => {
    const result = validateContactForm({
      workEmail: "not-an-email",
      name: "",
      company: "",
      role: "",
      deploymentStage: "",
      expectedUsers: "",
      governanceConcern: "",
      message: "x".repeat(2001),
      consent: false,
    });

    expect(result.status).toBe("validation-error");
    if (result.status !== "validation-error") {
      throw new Error("Expected validation errors.");
    }

    expect(result.errors).toMatchObject({
      workEmail: expect.stringMatching(/valid format/u),
      name: expect.stringMatching(/name/u),
      company: expect.stringMatching(/company/u),
      role: expect.stringMatching(/role/u),
      deploymentStage: expect.stringMatching(/deployment stage/u),
      expectedUsers: expect.stringMatching(/expected number/u),
      governanceConcern: expect.stringMatching(/governance concern/u),
      message: expect.stringMatching(/2,000/u),
      consent: expect.stringMatching(/does not send/u),
    });
    expect(firstInvalidContactField(result.errors)).toBe("workEmail");
  });

  it("hydrates input from FormData with checkbox consent", () => {
    const formData = new FormData();
    formData.set("workEmail", "demo@example.com");
    formData.set("name", "Demo User");
    formData.set("company", "Example");
    formData.set("role", "IT");
    formData.set("deploymentStage", deploymentStageOptions[1]);
    formData.set("expectedUsers", expectedUsersOptions[0]);
    formData.set("governanceConcern", governanceConcernOptions[1]);
    formData.set("message", "");
    formData.set("consent", "yes");

    expect(inputFromFormData(formData)).toMatchObject({
      workEmail: "demo@example.com",
      consent: true,
    });
  });

  it("defines every required submission state without enabling production submission", async () => {
    const expectedStates = [
      "idle",
      "validating",
      "validation-error",
      "submitting",
      "success",
      "retryable-failure",
      "rate-limited",
      "spam-blocked",
      "unavailable",
    ] satisfies ContactSubmissionState["status"][];

    expect(Object.keys(contactSubmissionStateCopy).sort()).toEqual(
      [...expectedStates].sort(),
    );
    expect(contactFormProcessorEnabled).toBe(false);

    const result = validateContactForm(validInput);
    if (result.status !== "valid") {
      throw new Error("Expected valid contact form input.");
    }

    await expect(submitContactForm(result.submission)).resolves.toMatchObject({
      status: "unavailable",
      canRetry: true,
      message: expect.stringMatching(/not open yet/u),
    });
  });
});
