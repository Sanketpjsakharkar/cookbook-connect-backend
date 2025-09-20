import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'User role in the system',
});
