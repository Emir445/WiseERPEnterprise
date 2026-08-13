import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../core/database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOperation({ summary: 'Verificar se o processo da API está ativo' })
  live(): { status: string; timestamp: string } {
    return {
      status: 'live',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar prontidão da API' })
  async ready(): Promise<{
    status: string;
    database: string;
    latencyMs: number;
    timestamp: string;
  }> {
    const started = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ready',
      database: 'connected',
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Verificar saúde da API e do banco de dados' })
  async check(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
