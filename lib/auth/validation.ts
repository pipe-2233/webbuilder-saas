export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthField = "email" | "password" | "confirmPassword";
export type FieldErrors = Partial<Record<AuthField, string>>;

export type Credentials = { email: string; password: string };

type ValidationResult =
  | { success: true; data: Credentials }
  | { success: false; errors: FieldErrors };

export function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function validateEmail(email: string): string | undefined {
  if (!email) return "Ingresa tu correo electrónico.";
  if (!EMAIL_PATTERN.test(email)) return "Ingresa un correo electrónico válido.";
  return undefined;
}

function toResult(errors: FieldErrors, data: Credentials): ValidationResult {
  return Object.keys(errors).length > 0 ? { success: false, errors } : { success: true, data };
}

export function validateLogin(formData: FormData): ValidationResult {
  const email = readString(formData, "email").trim().toLowerCase();
  const password = readString(formData, "password");

  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password) errors.password = "Ingresa tu contraseña.";

  return toResult(errors, { email, password });
}

export function validateRegister(formData: FormData): ValidationResult {
  const email = readString(formData, "email").trim().toLowerCase();
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  const errors: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = "La contraseña debe incluir letras y números.";
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return toResult(errors, { email, password });
}
