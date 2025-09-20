import { PrismaService } from '@/core/database';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateRecipeInput } from '../dto/create-recipe.dto';
import { RecipesRepository } from '../repositories/recipes.repository';
import { RecipesService } from './recipes.service';

describe('RecipesService', () => {
  let service: RecipesService;
  let repository: jest.Mocked<RecipesRepository>;

  const mockRecipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'Test description',
    cuisine: CuisineType.ITALIAN,
    difficulty: RecipeDifficulty.EASY,
    cookingTime: 30,
    servings: 4,
    imageUrl: null,
    isPublic: true,
    authorId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'user1',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      avatar: null,
    },
    ingredients: [
      {
        id: 'ing1',
        name: 'Tomato',
        quantity: 2,
        unit: 'pieces',
        notes: null,
        recipeId: '1',
      },
    ],
    instructions: [
      {
        id: 'inst1',
        stepNumber: 1,
        description: 'Chop tomatoes',
        recipeId: '1',
      },
    ],
    _count: {
      ratings: 5,
      comments: 3,
    },
    ratings: [
      { value: 4 },
      { value: 5 },
      { value: 4 },
      { value: 5 },
      { value: 3 },
    ],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByAuthor: jest.fn(),
      getRecommendedRecipes: jest.fn(),
      findByIngredients: jest.fn(),
    };

    const mockPrismaService = {
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: mockRepository,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    repository = module.get(RecipesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a recipe and sync to Elasticsearch', async () => {
      const createInput: CreateRecipeInput = {
        title: 'Test Recipe',
        description: 'Test description',
        cuisine: CuisineType.ITALIAN,
        difficulty: RecipeDifficulty.EASY,
        cookingTime: 30,
        servings: 4,
        isPublic: true,
        ingredients: [
          {
            name: 'Tomato',
            quantity: 2,
            unit: 'pieces',
          },
        ],
        instructions: [
          {
            stepNumber: 1,
            description: 'Chop tomatoes',
          },
        ],
      };

      repository.create.mockResolvedValue(mockRecipe);

      const result = await service.create('user1', createInput);

      expect(repository.create).toHaveBeenCalledWith('user1', createInput);
      expect(result).toEqual({
        ...mockRecipe,
        avgRating: 4.2,
        ratingsCount: 5,
        commentsCount: 3,
      });
    });
  });

  describe('findById', () => {
    it('should return a recipe with computed fields', async () => {
      repository.findById.mockResolvedValue(mockRecipe);

      const result = await service.findById('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        ...mockRecipe,
        avgRating: 4.2,
        ratingsCount: 5,
        commentsCount: 3,
      });
    });

    it('should throw error if recipe not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow('Recipe not found');
    });
  });

  describe('update', () => {
    it('should update recipe', async () => {
      const updateInput = {
        title: 'Updated Recipe',
        description: 'Updated description',
      };

      const updatedRecipe = { ...mockRecipe, ...updateInput };
      repository.findById.mockResolvedValue(mockRecipe);
      repository.update.mockResolvedValue(updatedRecipe);

      const result = await service.update('1', 'user1', updateInput);

      expect(repository.update).toHaveBeenCalledWith('1', updateInput);
      expect(result).toEqual({
        ...updatedRecipe,
        avgRating: 4.2,
        ratingsCount: 5,
        commentsCount: 3,
      });
    });
  });

  describe('delete', () => {
    it('should delete recipe', async () => {
      repository.findById.mockResolvedValue(mockRecipe);
      repository.delete.mockResolvedValue(mockRecipe);

      const result = await service.delete('1', 'user1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });
  });
});
