import { CuisineType } from './cuisine-type.enum';

describe('CuisineType', () => {
  it('should have ITALIAN cuisine', () => {
    expect(CuisineType.ITALIAN).toBe('ITALIAN');
  });

  it('should have CHINESE cuisine', () => {
    expect(CuisineType.CHINESE).toBe('CHINESE');
  });

  it('should have MEXICAN cuisine', () => {
    expect(CuisineType.MEXICAN).toBe('MEXICAN');
  });

  it('should have INDIAN cuisine', () => {
    expect(CuisineType.INDIAN).toBe('INDIAN');
  });

  it('should have FRENCH cuisine', () => {
    expect(CuisineType.FRENCH).toBe('FRENCH');
  });

  it('should have JAPANESE cuisine', () => {
    expect(CuisineType.JAPANESE).toBe('JAPANESE');
  });

  it('should have THAI cuisine', () => {
    expect(CuisineType.THAI).toBe('THAI');
  });

  it('should have AMERICAN cuisine', () => {
    expect(CuisineType.AMERICAN).toBe('AMERICAN');
  });

  it('should have MEDITERRANEAN cuisine', () => {
    expect(CuisineType.MEDITERRANEAN).toBe('MEDITERRANEAN');
  });

  it('should have OTHER cuisine', () => {
    expect(CuisineType.OTHER).toBe('OTHER');
  });

  it('should have all expected cuisine types', () => {
    const cuisines = Object.values(CuisineType);
    expect(cuisines).toHaveLength(10);
    expect(cuisines).toContain('ITALIAN');
    expect(cuisines).toContain('CHINESE');
    expect(cuisines).toContain('MEXICAN');
    expect(cuisines).toContain('INDIAN');
    expect(cuisines).toContain('FRENCH');
    expect(cuisines).toContain('JAPANESE');
    expect(cuisines).toContain('THAI');
    expect(cuisines).toContain('AMERICAN');
    expect(cuisines).toContain('MEDITERRANEAN');
    expect(cuisines).toContain('OTHER');
  });
});
