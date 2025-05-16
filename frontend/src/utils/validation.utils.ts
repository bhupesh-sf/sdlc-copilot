export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface FieldValidation {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Common validation rules
export const required = (fieldName: string): ValidationRule => ({
  validate: (value: string) => value.trim().length > 0,
  message: `${fieldName} is required`,
});

export const email = (): ValidationRule => ({
  validate: (value: string) =>
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
  message: 'Invalid email address',
});

export const minLength = (length: number): ValidationRule => ({
  validate: (value: string) => value.length >= length,
  message: `Must be at least ${length} characters`,
});

export const maxLength = (length: number): ValidationRule => ({
  validate: (value: string) => value.length <= length,
  message: `Must be no more than ${length} characters`,
});

export const passwordStrength = (): ValidationRule => ({
  validate: (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/.test(value),
  message:
    'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number',
});

export const jiraIdFormat = (): ValidationRule => ({
  validate: (value: string) => 
    value === '' || /^[A-Z]+-\d+$/.test(value),
  message: 'Jira ID must be in format PROJECT-123',
});

// Validate a single field
export const validateField = (
  value: string,
  rules: ValidationRule[]
): string | undefined => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return undefined;
};

// Validate all form fields
export const validateForm = (
  values: { [key: string]: string },
  validations: FieldValidation
): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(validations).forEach((fieldName) => {
    const value = values[fieldName] || '';
    const fieldRules = validations[fieldName];
    const error = validateField(value, fieldRules);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

// Check if form has any errors
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

// Common validation schemas
export const loginValidation: FieldValidation = {
  email: [required('Email'), email()],
  password: [required('Password')],
};

export const registerValidation: FieldValidation = {
  email: [required('Email'), email()],
  password: [required('Password'), passwordStrength()],
  full_name: [required('Full name'), minLength(2), maxLength(50)],
};

export const projectValidation: FieldValidation = {
  name: [required('Project name'), minLength(3), maxLength(100)],
  description: [maxLength(500)],
  jira_id: [jiraIdFormat()],
};