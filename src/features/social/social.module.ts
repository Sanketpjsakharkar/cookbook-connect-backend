import { Module } from '@nestjs/common';
import { SocialService } from './services/social.service';
import { SocialResolver } from './resolvers/social.resolver';
import { SocialRepository } from './repositories/social.repository';

@Module({
  providers: [SocialService, SocialResolver, SocialRepository],
  exports: [SocialService],
})
export class SocialModule {}
