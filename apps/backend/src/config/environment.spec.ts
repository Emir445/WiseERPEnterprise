import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  const baseConfig = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://wise:password@localhost:5432/wiseone',
    JWT_ACCESS_SECRET: 'access-secret-123456789012345678901234567890',
    JWT_REFRESH_SECRET: 'refresh-secret-1234567890123456789012345678',
    PORT: '3000',
  };

  it('aceita uma configuracao valida e normaliza NODE_ENV', () => {
    const result = validateEnvironment({
      ...baseConfig,
      NODE_ENV: '  STAGING  ',
    });

    expect(result.NODE_ENV).toBe('staging');
    expect(result.DATABASE_URL).toBe(baseConfig.DATABASE_URL);
  });

  it('exige DATABASE_URL', () => {
    const { DATABASE_URL: _databaseUrl, ...config } = baseConfig;

    expect(() => validateEnvironment(config)).toThrow(
      'Variável de ambiente obrigatória ausente: DATABASE_URL',
    );
  });

  it('rejeita segredo JWT curto', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        JWT_ACCESS_SECRET: 'curto',
      }),
    ).toThrow('JWT_ACCESS_SECRET deve possuir pelo menos 32 caracteres.');
  });

  it('rejeita segredos de access e refresh iguais', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        JWT_REFRESH_SECRET: baseConfig.JWT_ACCESS_SECRET,
      }),
    ).toThrow('JWT_ACCESS_SECRET e JWT_REFRESH_SECRET devem ser diferentes.');
  });

  it('rejeita valor de exemplo em producao', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'replace_with_a_real_access_secret_1234567890',
      }),
    ).toThrow(
      'JWT_ACCESS_SECRET contém um valor de exemplo e não pode ser usado em produção.',
    );
  });

  it('rejeita NODE_ENV desconhecido', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        NODE_ENV: 'homologacao',
      }),
    ).toThrow(
      'NODE_ENV inválido: homologacao. Use development, test, staging ou production.',
    );
  });

  it('rejeita porta fora da faixa valida', () => {
    expect(() =>
      validateEnvironment({
        ...baseConfig,
        PORT: '70000',
      }),
    ).toThrow('PORT deve ser um número inteiro entre 1 e 65535.');
  });
});
