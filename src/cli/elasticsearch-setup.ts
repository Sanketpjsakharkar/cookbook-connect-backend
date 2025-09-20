#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ElasticsearchSyncService } from '../features/search/services/elasticsearch-sync.service';
import { ElasticsearchService } from '../core/infrastructure/elasticsearch';

async function setupElasticsearch() {
  console.log('🔄 Setting up Elasticsearch...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const elasticsearchService = app.get(ElasticsearchService);
    const syncService = app.get(ElasticsearchSyncService);
    
    console.log('📊 Creating Elasticsearch indices...');
    await elasticsearchService.createIndicesIfNotExists();
    
    console.log('🔄 Starting bulk recipe sync...');
    await syncService.bulkSyncRecipes();
    
    console.log('✅ Elasticsearch setup completed successfully!');
  } catch (error) {
    console.error('❌ Elasticsearch setup failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  setupElasticsearch();
}

export { setupElasticsearch };
