import { RecipeDifficulty } from './recipe-difficulty.enum';

describe('RecipeDifficulty', () => {
  it('should have EASY difficulty', () => {
    expect(RecipeDifficulty.EASY).toBe('EASY');
  });

  it('should have MEDIUM difficulty', () => {
    expect(RecipeDifficulty.MEDIUM).toBe('MEDIUM');
  });

  it('should have HARD difficulty', () => {
    expect(RecipeDifficulty.HARD).toBe('HARD');
  });

  it('should have all expected difficulty levels', () => {
    const difficulties = Object.values(RecipeDifficulty);
    expect(difficulties).toContain('EASY');
    expect(difficulties).toContain('MEDIUM');
    expect(difficulties).toContain('HARD');
    expect(difficulties).toHaveLength(3);
  });
});
