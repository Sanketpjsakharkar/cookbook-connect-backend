import { ElasticsearchModule } from '@/core/infrastructure/elasticsearch';
import { Module } from '@nestjs/common';
import { SearchResolver } from './resolvers/search.resolver';
import { ElasticsearchSyncService } from './services/elasticsearch-sync.service';
import { SearchService } from './services/search.service';

@Module({
  imports: [ElasticsearchModule],
  providers: [SearchService, ElasticsearchSyncService, SearchResolver],
  exports: [SearchService, ElasticsearchSyncService],
})
export class SearchModule {}
