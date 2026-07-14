import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { QueueService } from './queue.service';
import { RedisService } from './redis.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, S3Service, QueueService],
  exports: [PrismaService, RedisService, S3Service, QueueService],
})
export class InfraModule {}
