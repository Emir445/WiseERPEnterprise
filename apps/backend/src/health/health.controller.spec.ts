import { PrismaService } from '../core/database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let queryRaw: jest.Mock;

  beforeEach(() => {
    queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;

    controller = new HealthController(prisma);
  });

  describe('live', () => {
    it('deve informar que o processo está ativo sem consultar o banco', () => {
      const result = controller.live();

      expect(result.status).toBe('live');
      expect(result.timestamp).toBeDefined();
      expect(queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('ready', () => {
    it('deve validar o banco antes de informar prontidão', async () => {
      const result = await controller.ready();

      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('ready');
      expect(result.database).toBe('connected');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('deve falhar quando o banco não estiver disponível', async () => {
      queryRaw.mockRejectedValueOnce(new Error('database unavailable'));

      await expect(controller.ready()).rejects.toThrow('database unavailable');
    });
  });

  describe('check', () => {
    it('deve validar API e banco', async () => {
      const result = await controller.check();

      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        expect.objectContaining({
          status: 'ok',
          database: 'connected',
        }),
      );
      expect(result.timestamp).toBeDefined();
    });
  });
});
