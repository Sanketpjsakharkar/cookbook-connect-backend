import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;

  constructor(private configService: ConfigService) {
    const elasticsearchConfig = this.configService.get('elasticsearch');
    this.client = new Client({
      node: elasticsearchConfig.url,
      requestTimeout: 30000,
      pingTimeout: 3000,
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('✅ Elasticsearch connection established');
      await this.createIndicesIfNotExists();
    } catch (error) {
      this.logger.error('❌ Failed to connect to Elasticsearch:', error);
    }
  }

  getClient(): Client {
    return this.client;
  }

  async createIndicesIfNotExists() {
    const indices = ['recipes', 'ingredients'];
    
    for (const index of indices) {
      const exists = await this.client.indices.exists({ index });
      if (!exists) {
        await this.createIndex(index);
        this.logger.log(`📊 Created Elasticsearch index: ${index}`);
      }
    }
  }

  private async createIndex(indexName: string) {
    const mappings = this.getIndexMappings(indexName);
    
    await this.client.indices.create({
      index: indexName,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            ingredient_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'stemmer'],
            },
            autocomplete_analyzer: {
              type: 'custom',
              tokenizer: 'autocomplete_tokenizer',
              filter: ['lowercase'],
            },
            autocomplete_search_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase'],
            },
          },
          tokenizer: {
            autocomplete_tokenizer: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
              token_chars: ['letter', 'digit'],
            },
          },
        },
      },
      mappings: mappings as any,
    });
  }

  private getIndexMappings(indexName: string) {
    switch (indexName) {
      case 'recipes':
        return {
          properties: {
            id: { type: 'keyword' },
            title: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                  search_analyzer: 'autocomplete_search_analyzer',
                },
              },
            },
            description: {
              type: 'text',
              analyzer: 'standard',
            },
            cuisine: { type: 'keyword' },
            difficulty: { type: 'keyword' },
            cookingTime: { type: 'integer' },
            servings: { type: 'integer' },
            isPublic: { type: 'boolean' },
            authorId: { type: 'keyword' },
            authorUsername: { type: 'keyword' },
            ingredients: {
              type: 'nested',
              properties: {
                name: {
                  type: 'text',
                  analyzer: 'ingredient_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    autocomplete: {
                      type: 'text',
                      analyzer: 'autocomplete_analyzer',
                      search_analyzer: 'autocomplete_search_analyzer',
                    },
                  },
                },
                quantity: { type: 'float' },
                unit: { type: 'keyword' },
              },
            },
            instructions: {
              type: 'nested',
              properties: {
                stepNumber: { type: 'integer' },
                description: { type: 'text' },
              },
            },
            avgRating: { type: 'float' },
            ratingsCount: { type: 'integer' },
            commentsCount: { type: 'integer' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        };

      case 'ingredients':
        return {
          properties: {
            name: {
              type: 'text',
              analyzer: 'ingredient_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                autocomplete: {
                  type: 'text',
                  analyzer: 'autocomplete_analyzer',
                  search_analyzer: 'autocomplete_search_analyzer',
                },
              },
            },
            usageCount: { type: 'integer' },
            category: { type: 'keyword' },
          },
        };

      default:
        return {};
    }
  }

  async indexDocument(index: string, id: string, document: any) {
    try {
      await this.client.index({
        index,
        id,
        document,
        refresh: 'wait_for',
      });
    } catch (error) {
      this.logger.error(`Failed to index document ${id} in ${index}:`, error);
      throw error;
    }
  }

  async updateDocument(index: string, id: string, document: any) {
    try {
      await this.client.update({
        index,
        id,
        doc: document,
        refresh: 'wait_for',
      });
    } catch (error) {
      this.logger.error(`Failed to update document ${id} in ${index}:`, error);
      throw error;
    }
  }

  async deleteDocument(index: string, id: string) {
    try {
      await this.client.delete({
        index,
        id,
        refresh: 'wait_for',
      });
    } catch (error) {
      this.logger.error(`Failed to delete document ${id} from ${index}:`, error);
      throw error;
    }
  }

  async search(index: string, query: any) {
    try {
      const response = await this.client.search({
        index,
        ...query,
      });
      return response;
    } catch (error) {
      this.logger.error(`Search failed in ${index}:`, error);
      throw error;
    }
  }

  async bulkIndex(index: string, documents: Array<{ id: string; document: any }>) {
    const operations = documents.flatMap(({ id, document }) => [
      { index: { _index: index, _id: id } },
      document,
    ]);

    try {
      const response = await this.client.bulk({
        operations,
        refresh: 'wait_for',
      });

      if (response.errors) {
        this.logger.error('Bulk indexing errors:', response.items);
      }

      return response;
    } catch (error) {
      this.logger.error('Bulk indexing failed:', error);
      throw error;
    }
  }
}
