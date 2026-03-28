import { timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/;

export class PasswordManager {
  static isBcryptHash(stored: string): boolean {
    return BCRYPT_HASH_RE.test(stored);
  }

  /**
   * bcrypt.verify for hashed passwords; timing-safe equality for legacy plaintext
   * (students created before passwords were hashed on insert).
   */
  static async verifyStudentOrLegacy(plain: string, stored: string): Promise<boolean> {
    if (this.isBcryptHash(stored)) {
      return bcrypt.compare(plain, stored);
    }
    const a = Buffer.from(plain, "utf8");
    const b = Buffer.from(stored, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    try {
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validate(password: string): { valid: boolean; message: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }
    return { valid: true, message: '' };
  }
}
