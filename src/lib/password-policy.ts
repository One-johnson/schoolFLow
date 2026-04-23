/** Shared portal password rules (no Node/crypto) — keep in sync with server validation. */

export function validatePortalPassword(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return {
      valid: false,
      message:
        "Password must contain at least one special character (!@#$%^&*)",
    };
  }
  return { valid: true, message: "" };
}

export function portalPasswordCriteriaMet(password: string): {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
} {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

export function portalPasswordStrengthLabel(password: string): {
  label: string;
  score: number;
} {
  const m = portalPasswordCriteriaMet(password);
  const score = Object.values(m).filter(Boolean).length;
  if (score <= 2) return { label: "Weak", score };
  if (score <= 3) return { label: "Fair", score };
  if (score <= 4) return { label: "Good", score };
  return { label: "Strong", score };
}
