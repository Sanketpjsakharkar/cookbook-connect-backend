#!/usr/bin/env ts-node

/**
 * Test script for real-time functionality
 * This script demonstrates how to test GraphQL subscriptions locally
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';

async function testRealTimeFeatures() {
  const logger = new Logger('RealTimeTest');
  
  try {
    logger.log('🚀 Starting real-time functionality test...');
    
    // Create the NestJS application
    const app = await NestFactory.create(AppModule);
    
    // Get services for testing
    const notificationsService = app.get('NotificationsService');
    const connectionManager = app.get('ConnectionManagerService');
    
    logger.log('✅ Application initialized successfully');
    
    // Test connection manager
    await connectionManager.addConnection('test-connection-1', 'user-123');
    await connectionManager.addConnection('test-connection-2', 'user-456');
    
    const stats = connectionManager.getConnectionStats();
    logger.log(`📊 Connection stats: ${JSON.stringify(stats)}`);
    
    // Test notification publishing
    logger.log('📢 Testing notification publishing...');
    
    // Simulate a recipe creation notification
    await notificationsService.createRecipeNotification('recipe-123', 'user-123');
    
    // Simulate a comment notification
    await notificationsService.createCommentNotification('comment-456', 'user-456', 'recipe-123');
    
    // Simulate a rating notification
    await notificationsService.createRatingNotification('rating-789', 'user-456', 'recipe-123');
    
    // Simulate a follow notification
    await notificationsService.createFollowNotification('user-456', 'user-123');
    
    logger.log('✅ All notifications published successfully');
    
    // Clean up test connections
    await connectionManager.removeConnection('test-connection-1');
    await connectionManager.removeConnection('test-connection-2');
    
    logger.log('🧹 Test connections cleaned up');
    
    await app.close();
    logger.log('🎉 Real-time functionality test completed successfully!');
    
  } catch (error) {
    logger.error('❌ Real-time test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testRealTimeFeatures();
}

export { testRealTimeFeatures };
