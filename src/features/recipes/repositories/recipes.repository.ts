import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database';
import { CreateRecipeInput } from '../dto/create-recipe.dto';
import { UpdateRecipeInput } from '../dto/update-recipe.dto';
import { RecipeFilterInput } from '../dto/recipe-filter.dto';

@Injectable()
export class RecipesRepository {
  constructor(private prismaService: PrismaService) {}

  async create(authorId: string, createRecipeInput: CreateRecipeInput) {
    const { ingredients, instructions, ...recipeData } = createRecipeInput;

    return this.prismaService.recipe.create({
      data: {
        ...recipeData,
        authorId,
        ingredients: {
          create: ingredients,
        },
        instructions: {
          create: instructions,
        },
      },
      include: this.getRecipeIncludes(),
    });
  }

  async findById(id: string) {
    return this.prismaService.recipe.findUnique({
      where: { id },
      include: this.getRecipeIncludes(),
    });
  }

  async findMany(
    skip?: number,
    take?: number,
    filter?: RecipeFilterInput,
  ) {
    const where: any = { isPublic: true };

    if (filter) {
      if (filter.cuisines?.length) {
        where.cuisine = { in: filter.cuisines };
      }
      if (filter.difficulties?.length) {
        where.difficulty = { in: filter.difficulties };
      }
      if (filter.maxCookingTime) {
        where.cookingTime = { lte: filter.maxCookingTime };
      }
      if (filter.authorId) {
        where.authorId = filter.authorId;
      }
      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }
      if (filter.ingredients?.length) {
        where.ingredients = {
          some: {
            name: {
              in: filter.ingredients,
              mode: 'insensitive',
            },
          },
        };
      }
    }

    return this.prismaService.recipe.findMany({
      where,
      skip,
      take,
      include: this.getRecipeIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateRecipeInput: UpdateRecipeInput) {
    const { ingredients, instructions, ...recipeData } = updateRecipeInput;

    // Start a transaction to handle ingredients and instructions updates
    return this.prismaService.$transaction(async (prisma) => {
      // Update recipe basic data
      await prisma.recipe.update({
        where: { id },
        data: recipeData,
      });

      // Update ingredients if provided
      if (ingredients) {
        await prisma.ingredient.deleteMany({ where: { recipeId: id } });
        await prisma.ingredient.createMany({
          data: ingredients.map(ingredient => ({ ...ingredient, recipeId: id })),
        });
      }

      // Update instructions if provided
      if (instructions) {
        await prisma.instruction.deleteMany({ where: { recipeId: id } });
        await prisma.instruction.createMany({
          data: instructions.map(instruction => ({ ...instruction, recipeId: id })),
        });
      }

      // Return updated recipe with includes
      return prisma.recipe.findUnique({
        where: { id },
        include: this.getRecipeIncludes(),
      });
    });
  }

  async delete(id: string) {
    return this.prismaService.recipe.delete({
      where: { id },
    });
  }

  async findByIngredients(ingredientNames: string[], limit: number = 20) {
    return this.prismaService.recipe.findMany({
      where: {
        isPublic: true,
        ingredients: {
          some: {
            name: {
              in: ingredientNames,
              mode: 'insensitive',
            },
          },
        },
      },
      include: this.getRecipeIncludes(),
      take: limit,
      orderBy: [
        {
          ingredients: {
            _count: 'desc',
          },
        },
        { createdAt: 'desc' },
      ],
    });
  }

  async findUserFeed(userId: string, skip?: number, take?: number) {
    return this.prismaService.recipe.findMany({
      where: {
        isPublic: true,
        author: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      skip,
      take,
      include: this.getRecipeIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  private getRecipeIncludes() {
    return {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      ingredients: {
        orderBy: { name: 'asc' as const },
      },
      instructions: {
        orderBy: { stepNumber: 'asc' as const },
      },
      _count: {
        select: {
          ratings: true,
          comments: true,
        },
      },
      ratings: {
        select: {
          value: true,
        },
      },
    };
  }
}
