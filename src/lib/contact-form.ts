export const contactFormProcessorEnabled = false as const;

export const contactFormFields = [
  "workEmail",
  "name",
  "company",
  "role",
  "deploymentStage",
  "expectedUsers",
  "message",
  "consent",
] as const;

export type ContactFormField = (typeof contactFormFields)[number];

export const deploymentStageOptions = [
  "Exploring fit",
  "Planning a pilot",
  "Running a pilot",
  "Expanding a rollout",
] as const;

export const expectedUsersOptions = [
  "1-25",
  "26-100",
  "101-500",
  "500+",
] as const;

export type DeploymentStage = (typeof deploymentStageOptions)[number];
export type ExpectedUsers = (typeof expectedUsersOptions)[number];

export type ContactFormInput = Readonly<{
  workEmail: string;
  name: string;
  company: string;
  role: string;
  deploymentStage: string;
  expectedUsers: string;
  message: string;
  consent: boolean;
}>;

export type ContactFormSubmission = Readonly<{
  workEmail: string;
  name: string;
  company: string;
  role: string;
  deploymentStage?: DeploymentStage;
  expectedUsers?: ExpectedUsers;
  message?: string;
  consent: true;
}>;

export type ContactFormErrors = Partial<Record<ContactFormField, string>>;

export type ContactValidationResult =
  | Readonly<{ status: "valid"; submission: ContactFormSubmission }>
  | Readonly<{ status: "validation-error"; errors: ContactFormErrors }>;

export type ContactSubmissionState =
  | Readonly<{ status: "idle"; message: string }>
  | Readonly<{ status: "validating"; message: string }>
  | Readonly<{
      status: "validation-error";
      message: string;
      errors: ContactFormErrors;
    }>
  | Readonly<{ status: "submitting"; message: string }>
  | Readonly<{ status: "success"; message: string }>
  | Readonly<{ status: "retryable-failure"; message: string; canRetry: true }>
  | Readonly<{ status: "rate-limited"; message: string; canRetry: true }>
  | Readonly<{ status: "spam-blocked"; message: string; canRetry: false }>
  | Readonly<{ status: "unavailable"; message: string; canRetry: true }>;

export const contactSubmissionStateCopy = {
  idle: "Complete the form to prepare a demo request.",
  validating: "Checking the request details.",
  "validation-error": "Some fields need attention before this can be checked.",
  submitting: "Checking whether online demo requests are available.",
  success: "Your demo request was received.",
  "retryable-failure":
    "We could not check the demo request right now. You can try again.",
  "rate-limited":
    "Too many attempts were made from this browser. Please wait before trying again.",
  "spam-blocked":
    "This request could not be accepted. Remove promotional or unsafe content and try later.",
  unavailable:
    "Online demo requests are not open yet. This page is ready, but Glaux has not opened online request handling.",
} as const satisfies Record<ContactSubmissionState["status"], string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/gu, " ");
}

function isOption<T extends readonly string[]>(
  options: T,
  value: string,
): value is T[number] {
  return options.includes(value);
}

function addRequiredTextError(
  errors: ContactFormErrors,
  field: ContactFormField,
  value: string,
  message: string,
): void {
  if (!value.trim()) {
    errors[field] = message;
  }
}

export function inputFromFormData(formData: FormData): ContactFormInput {
  return {
    workEmail: String(formData.get("workEmail") ?? ""),
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    role: String(formData.get("role") ?? ""),
    deploymentStage: String(formData.get("deploymentStage") ?? ""),
    expectedUsers: String(formData.get("expectedUsers") ?? ""),
    message: String(formData.get("message") ?? ""),
    consent: formData.get("consent") === "yes",
  };
}

export function validateContactForm(
  input: ContactFormInput,
): ContactValidationResult {
  const errors: ContactFormErrors = {};
  const workEmail = input.workEmail.trim().toLowerCase();
  const name = normalizeText(input.name);
  const company = normalizeText(input.company);
  const role = normalizeText(input.role);
  const deploymentStage = input.deploymentStage.trim();
  const expectedUsers = input.expectedUsers.trim();
  const message = input.message.trim();

  addRequiredTextError(
    errors,
    "workEmail",
    input.workEmail,
    "Please enter your work email.",
  );
  addRequiredTextError(errors, "name", input.name, "Please enter your name.");
  addRequiredTextError(
    errors,
    "company",
    input.company,
    "Please enter your company.",
  );
  addRequiredTextError(errors, "role", input.role, "Please enter your role.");

  if (workEmail && !emailPattern.test(workEmail)) {
    errors.workEmail =
      "Work email needs a valid format, like name@company.com.";
  }

  if (deploymentStage && !isOption(deploymentStageOptions, deploymentStage)) {
    errors.deploymentStage = "Choose a deployment stage from the list.";
  }

  if (expectedUsers && !isOption(expectedUsersOptions, expectedUsers)) {
    errors.expectedUsers = "Choose an expected user range from the list.";
  }

  if (message.length > 2000) {
    errors.message = "Keep the optional message under 2,000 characters.";
  }

  if (!input.consent) {
    errors.consent =
      "Confirm that you understand this form does not send information yet.";
  }

  if (Object.keys(errors).length > 0) {
    return { status: "validation-error", errors };
  }

  return {
    status: "valid",
    submission: {
      workEmail,
      name,
      company,
      role,
      ...(deploymentStage
        ? { deploymentStage: deploymentStage as DeploymentStage }
        : {}),
      ...(expectedUsers
        ? { expectedUsers: expectedUsers as ExpectedUsers }
        : {}),
      ...(message ? { message } : {}),
      consent: true,
    },
  };
}

export function firstInvalidContactField(
  errors: ContactFormErrors,
): ContactFormField | undefined {
  return contactFormFields.find((field) => errors[field]);
}

export async function submitContactForm(
  submission: ContactFormSubmission,
): Promise<ContactSubmissionState> {
  void submission;

  if (!contactFormProcessorEnabled) {
    return {
      status: "unavailable",
      message: contactSubmissionStateCopy.unavailable,
      canRetry: true,
    };
  }

  return {
    status: "retryable-failure",
    message: contactSubmissionStateCopy["retryable-failure"],
    canRetry: true,
  };
}
