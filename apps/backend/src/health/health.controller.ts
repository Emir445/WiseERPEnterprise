import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../core/database/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('ready')
  @ApiOperation({ summary: 'Verificar prontidao da API' })
  async ready() { const started=Date.now(); await this.prisma.$queryRaw`SELECT 1`; return { status:'ready', database:'connected', latencyMs:Date.now()-started, timestamp:new Date().toISOString() }; }

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
