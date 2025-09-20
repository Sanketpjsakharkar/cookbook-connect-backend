import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@/core/infrastructure/elasticsearch';
import { SearchService } from './services/search.service';
import { ElasticsearchSyncService } from './services/elasticsearch-sync.service';
import { SearchResolver } from './resolvers/search.resolver';

@Module({
  imports: [ElasticsearchModule],
  providers: [SearchService, ElasticsearchSyncService, SearchResolver],
  exports: [SearchService, ElasticsearchSyncService],
})
export class SearchModule {}
