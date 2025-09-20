import { PasswordUtil } from './password.util';

describe('PasswordUtil', () => {
  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await PasswordUtil.hash(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(typeof hashedPassword).toBe('string');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testpassword123';
      const hash1 = await PasswordUtil.hash(password);
      const hash2 = await PasswordUtil.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testpassword123';
      const hashedPassword = await PasswordUtil.hash(password);

      const isMatch = await PasswordUtil.compare(password, hashedPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await PasswordUtil.hash(password);

      const isMatch = await PasswordUtil.compare(wrongPassword, hashedPassword);

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await PasswordUtil.hash(password);

      const isMatch = await PasswordUtil.compare('', hashedPassword);

      expect(isMatch).toBe(false);
    });
  });
});
