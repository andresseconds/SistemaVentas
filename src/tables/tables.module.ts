import { Module } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [TablesController],
  providers: [TablesService, PrismaService],
})
export class TablesModule {}
