import { useState, ChangeEvent, FormEvent } from 'react';
import {
  FieldValidation,
  ValidationErrors,
  validateField,
  validateForm,
  hasErrors,
} from '../utils/validation.utils';

interface UseFormProps<T extends Record<string, any>> {
  initialValues: T;
  validationSchema: FieldValidation;
  onSubmit: (values: T) => Promise<void>;
}

interface UseFormReturn<T extends Record<string, any>> {
  values: T;
  errors: ValidationErrors;
  isSubmitting: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  resetForm: () => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

  const validateOnChange = (name: keyof T, value: any) => {
    if (touchedFields.has(name)) {
      const fieldRules = validationSchema[name as string];
      if (fieldRules) {
        const error = validateField(String(value), fieldRules);
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }));
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    } as T));
    validateOnChange(name as keyof T, value);
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => new Set(prev).add(name as keyof T));
    validateOnChange(name as keyof T, value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Create a validation object excluding file arrays
    const validationValues = Object.entries(values as Record<string, any>).reduce(
      (acc, [key, value]) => {
        if (!Array.isArray(value)) {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const formErrors = validateForm(validationValues, validationSchema);
    setErrors(formErrors);

    if (!hasErrors(formErrors)) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        if (error instanceof Error) {
          setErrors((prev) => ({
            ...prev,
            submit: error.message,
          }));
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const setFieldValue = <K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    } as T));
    if (typeof value === 'string') {
      validateOnChange(field, value);
    }
  };

  const setFieldError = (field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouchedFields(new Set());
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
  };
}