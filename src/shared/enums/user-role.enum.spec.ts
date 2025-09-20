import { UserRole } from './user-role.enum';

describe('UserRole', () => {
  it('should have USER role', () => {
    expect(UserRole.USER).toBe('USER');
  });

  it('should have ADMIN role', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
  });

  it('should have MODERATOR role', () => {
    expect(UserRole.MODERATOR).toBe('MODERATOR');
  });

  it('should have all expected roles', () => {
    const roles = Object.values(UserRole);
    expect(roles).toContain('USER');
    expect(roles).toContain('ADMIN');
    expect(roles).toContain('MODERATOR');
    expect(roles).toHaveLength(3);
  });
});
