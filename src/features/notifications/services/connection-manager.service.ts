import { RedisService } from '@/core/infrastructure/redis';
import { Injectable, Logger } from '@nestjs/common';

interface ConnectionInfo {
    userId: string;
    connectionId: string;
    connectedAt: Date;
    lastActivity: Date;
}

@Injectable()
export class ConnectionManagerService {
    private readonly logger = new Logger(ConnectionManagerService.name);
    private connections = new Map<string, ConnectionInfo>();
    private userConnections = new Map<string, Set<string>>();

    constructor(private redisService: RedisService) {
        // Clean up stale connections every 5 minutes
        setInterval(() => {
            this.cleanupStaleConnections();
        }, 5 * 60 * 1000);
    }

    async addConnection(connectionId: string, userId: string): Promise<void> {
        try {
            const connectionInfo: ConnectionInfo = {
                userId,
                connectionId,
                connectedAt: new Date(),
                lastActivity: new Date(),
            };

            this.connections.set(connectionId, connectionInfo);

            // Track user connections
            if (!this.userConnections.has(userId)) {
                this.userConnections.set(userId, new Set());
            }
            this.userConnections.get(userId)!.add(connectionId);

            // Store in Redis for distributed systems
            await this.redisService.hset(
                `connections:${connectionId}`,
                'userId',
                userId,
            );
            await this.redisService.hset(
                `connections:${connectionId}`,
                'connectedAt',
                connectionInfo.connectedAt.toISOString(),
            );

            // Add to user's connection set in Redis
            await this.redisService.sadd(`user_connections:${userId}`, connectionId);

            this.logger.debug(`Connection added: ${connectionId} for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to add connection ${connectionId}:`, error);
        }
    }

    async removeConnection(connectionId: string): Promise<void> {
        try {
            const connectionInfo = this.connections.get(connectionId);
            if (!connectionInfo) return;

            const { userId } = connectionInfo;

            // Remove from local maps
            this.connections.delete(connectionId);
            const userConnections = this.userConnections.get(userId);
            if (userConnections) {
                userConnections.delete(connectionId);
                if (userConnections.size === 0) {
                    this.userConnections.delete(userId);
                }
            }

            // Remove from Redis
            await this.redisService.del(`connections:${connectionId}`);
            await this.redisService.srem(`user_connections:${userId}`, connectionId);

            this.logger.debug(`Connection removed: ${connectionId} for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to remove connection ${connectionId}:`, error);
        }
    }

    async updateActivity(connectionId: string): Promise<void> {
        try {
            const connectionInfo = this.connections.get(connectionId);
            if (connectionInfo) {
                connectionInfo.lastActivity = new Date();
                await this.redisService.hset(
                    `connections:${connectionId}`,
                    'lastActivity',
                    connectionInfo.lastActivity.toISOString(),
                );
            }
        } catch (error) {
            this.logger.error(`Failed to update activity for ${connectionId}:`, error);
        }
    }

    getUserConnections(userId: string): string[] {
        const connections = this.userConnections.get(userId);
        return connections ? Array.from(connections) : [];
    }

    async getUserConnectionsFromRedis(userId: string): Promise<string[]> {
        try {
            return await this.redisService.smembers(`user_connections:${userId}`);
        } catch (error) {
            this.logger.error(`Failed to get user connections for ${userId}:`, error);
            return [];
        }
    }

    getConnectionInfo(connectionId: string): ConnectionInfo | undefined {
        return this.connections.get(connectionId);
    }

    async getConnectionInfoFromRedis(connectionId: string): Promise<ConnectionInfo | null> {
        try {
            const data = await this.redisService.hgetall(`connections:${connectionId}`);
            if (!data.userId) return null;

            return {
                userId: data.userId,
                connectionId,
                connectedAt: new Date(data.connectedAt),
                lastActivity: new Date(data.lastActivity || data.connectedAt),
            };
        } catch (error) {
            this.logger.error(`Failed to get connection info for ${connectionId}:`, error);
            return null;
        }
    }

    getTotalConnections(): number {
        return this.connections.size;
    }

    getTotalUsers(): number {
        return this.userConnections.size;
    }

    getConnectionStats(): {
        totalConnections: number;
        totalUsers: number;
        averageConnectionsPerUser: number;
    } {
        const totalConnections = this.getTotalConnections();
        const totalUsers = this.getTotalUsers();
        const averageConnectionsPerUser = totalUsers > 0 ? totalConnections / totalUsers : 0;

        return {
            totalConnections,
            totalUsers,
            averageConnectionsPerUser: Math.round(averageConnectionsPerUser * 100) / 100,
        };
    }

    private async cleanupStaleConnections(): Promise<void> {
        try {
            const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
            const staleConnections: string[] = [];

            for (const [connectionId, info] of this.connections.entries()) {
                if (info.lastActivity < staleThreshold) {
                    staleConnections.push(connectionId);
                }
            }

            for (const connectionId of staleConnections) {
                await this.removeConnection(connectionId);
            }

            if (staleConnections.length > 0) {
                this.logger.log(`Cleaned up ${staleConnections.length} stale connections`);
            }
        } catch (error) {
            this.logger.error('Failed to cleanup stale connections:', error);
        }
    }

    // Health check method
    async isHealthy(): Promise<boolean> {
        try {
            // Check Redis connectivity
            await this.redisService.get('health_check');
            return true;
        } catch (error) {
            this.logger.error('Connection manager health check failed:', error);
            return false;
        }
    }
}
