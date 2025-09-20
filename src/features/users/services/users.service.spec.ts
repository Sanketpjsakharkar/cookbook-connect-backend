import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserInput } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from './users.service';
import { UserRole } from '@/shared/enums';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    bio: 'Test bio',
    avatar: null,
    role: 'USER' as UserRole,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      recipes: 5,
      followers: 10,
      following: 3,
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      getMostFollowedUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        ...mockUser,
        recipesCount: 5,
        followersCount: 10,
        followingCount: 3,
      });
    });

    it('should throw error if user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow('User not found');
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      repository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(repository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toEqual({
        ...mockUser,
        recipesCount: 5,
        followersCount: 10,
        followingCount: 3,
      });
    });

    it('should throw error if user not found', async () => {
      repository.findByUsername.mockResolvedValue(null);

      await expect(service.findByUsername('nonexistent')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateInput: UpdateUserInput = {
        firstName: 'Updated',
        bio: 'Updated bio',
      };

      const updatedUser = { ...mockUser, ...updateInput };
      repository.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', updateInput);

      expect(repository.update).toHaveBeenCalledWith('1', updateInput);
      expect(result).toEqual({
        ...updatedUser,
        recipesCount: 5,
        followersCount: 10,
        followingCount: 3,
      });
    });
  });

  describe('getMostFollowedUsers', () => {
    it('should return most followed users', async () => {
      const users = [mockUser];
      repository.getMostFollowedUsers.mockResolvedValue(users);

      const result = await service.getMostFollowedUsers(10);

      expect(repository.getMostFollowedUsers).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockUser,
        recipesCount: 5,
        followersCount: 10,
        followingCount: 3,
      });
    });
  });
});
