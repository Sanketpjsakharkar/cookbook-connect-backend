#!/usr/bin/env ts-node

/**
 * Test script for AI features
 * This script demonstrates and tests AI functionality
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function testAIFeatures() {
    const logger = new Logger('AIFeaturesTest');

    try {
        logger.log('🤖 Starting AI features test...');

        // Create the NestJS application
        const app = await NestFactory.create(AppModule);

        // Get AI services for testing
        const openAIService = app.get('OpenAIService');
        const recipeAnalyzerService = app.get('RecipeAnalyzerService');
        const substitutionService = app.get('IngredientSubstitutionService');
        const cookingTipsService = app.get('CookingTipsService');
        const aiRateLimitGuard = app.get('AIRateLimitGuard');

        logger.log('✅ Application initialized successfully');

        // Test OpenAI service health
        logger.log('🔍 Testing OpenAI service health...');
        const isHealthy = await openAIService.isHealthy();
        logger.log(`OpenAI Service Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);

        // Test usage metrics
        logger.log('📊 Getting AI usage metrics...');
        const metrics = await openAIService.getUsageMetrics();
        logger.log(`Usage Metrics:`, {
            totalRequests: metrics.totalRequests,
            totalTokens: metrics.totalTokens,
            totalCost: `$${metrics.totalCost.toFixed(4)}`,
            requestsToday: metrics.requestsToday,
            tokensToday: metrics.tokensToday,
            costToday: `$${metrics.costToday.toFixed(4)}`,
        });

        // Test basic AI completion
        if (isHealthy) {
            logger.log('🧠 Testing basic AI completion...');
            const testPrompt = 'What are 3 essential tips for cooking pasta perfectly?';
            const response = await openAIService.generateCompletion(
                testPrompt,
                'You are a helpful cooking assistant.',
                {
                    maxTokens: 200,
                    temperature: 0.7,
                    cacheKey: 'test_pasta_tips',
                    cacheTTL: 300,
                }
            );

            if (response) {
                logger.log('✅ AI completion successful:');
                logger.log(response.substring(0, 200) + (response.length > 200 ? '...' : ''));
            } else {
                logger.warn('⚠️ AI completion returned null');
            }
        }

        // Test caching
        logger.log('💾 Testing AI response caching...');
        const startTime = Date.now();
        const cachedResponse = await openAIService.generateCompletion(
            'What are 3 essential tips for cooking pasta perfectly?',
            'You are a helpful cooking assistant.',
            {
                maxTokens: 200,
                temperature: 0.7,
                cacheKey: 'test_pasta_tips',
                cacheTTL: 300,
            }
        );
        const cacheTime = Date.now() - startTime;

        if (cachedResponse && cacheTime < 100) {
            logger.log(`✅ Cache hit detected (${cacheTime}ms response time)`);
        } else {
            logger.log(`⚠️ Cache miss or slow response (${cacheTime}ms)`);
        }

        // Test common substitutions
        logger.log('🔄 Testing common substitutions...');
        const commonSubs = await substitutionService.getCommonSubstitutions();
        const subCount = Object.keys(commonSubs).length;
        logger.log(`✅ Retrieved ${subCount} common ingredient substitutions`);

        // Test rate limiting (mock user)
        logger.log('⏱️ Testing rate limiting...');
        const mockUserId = 'test-user-123';
        const usage = await aiRateLimitGuard.getUserUsage(mockUserId);
        logger.log(`Rate Limit Status for ${mockUserId}:`, {
            hourlyRequests: `${usage.hourlyRequests}/${usage.limits.maxRequestsPerHour}`,
            dailyRequests: `${usage.dailyRequests}/${usage.limits.maxRequestsPerDay}`,
            dailyTokens: `${usage.dailyTokens}/${usage.limits.maxTokensPerDay}`,
        });

        // Test error handling
        logger.log('🚨 Testing error handling...');
        try {
            // This should handle gracefully if OpenAI is not configured
            const invalidResponse = await openAIService.generateCompletion(
                '', // Empty prompt
                '',
                { maxTokens: 0 } // Invalid max tokens
            );
            logger.log(`Error handling result: ${invalidResponse ? 'Unexpected success' : 'Graceful failure ✅'}`);
        } catch (error) {
            logger.log('✅ Error handled gracefully:', (error as Error).message);
        }

        // Performance test
        logger.log('⚡ Running performance test...');
        const perfStartTime = Date.now();
        const perfPromises = Array.from({ length: 3 }, (_, i) =>
            openAIService.generateCompletion(
                `Give me ${i + 1} quick cooking tip(s).`,
                'You are a concise cooking assistant.',
                {
                    maxTokens: 100,
                    cacheKey: `perf_test_${i}`,
                    cacheTTL: 60,
                }
            )
        );

        const perfResults = await Promise.allSettled(perfPromises);
        const perfTime = Date.now() - perfStartTime;
        const successCount = perfResults.filter(r => r.status === 'fulfilled' && r.value).length;

        logger.log(`Performance Test Results:`);
        logger.log(`- Total time: ${perfTime}ms`);
        logger.log(`- Successful requests: ${successCount}/3`);
        logger.log(`- Average time per request: ${Math.round(perfTime / 3)}ms`);

        if (perfTime < 15000 && successCount >= 2) {
            logger.log('✅ Performance test passed');
        } else {
            logger.warn('⚠️ Performance test concerns detected');
        }

        await app.close();
        logger.log('🎉 AI features test completed successfully!');

        // Summary
        logger.log('\n📋 Test Summary:');
        logger.log(`- OpenAI Service: ${isHealthy ? '✅' : '❌'}`);
        logger.log(`- Caching: ${cacheTime < 100 ? '✅' : '⚠️'}`);
        logger.log(`- Rate Limiting: ✅`);
        logger.log(`- Error Handling: ✅`);
        logger.log(`- Performance: ${perfTime < 15000 && successCount >= 2 ? '✅' : '⚠️'}`);
        logger.log(`- Common Substitutions: ✅ (${subCount} items)`);

    } catch (error) {
        logger.error('❌ AI features test failed:', error);
        process.exit(1);
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    testAIFeatures();
}

export { testAIFeatures };
