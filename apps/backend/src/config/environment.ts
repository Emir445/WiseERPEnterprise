type Environment = Record<string, string | undefined>;

const NODE_ENVS = new Set(['development', 'test', 'staging', 'production']);
const PLACEHOLDER_MARKERS = ['replace_with', 'change_me', 'changeme', 'example'];

function required(config: Environment, key: string): string {
  const value = config[key]?.trim();

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }

  return value;
}

function validateSecret(config: Environment, key: string, nodeEnv: string): string {
  const value = required(config, key);

  if (value.length < 32) {
    throw new Error(`${key} deve possuir pelo menos 32 caracteres.`);
  }

  if (
    nodeEnv === 'production' &&
    PLACEHOLDER_MARKERS.some((marker) => value.toLowerCase().includes(marker))
  ) {
    throw new Error(`${key} contém um valor de exemplo e não pode ser usado em produção.`);
  }

  return value;
}

export function validateEnvironment(config: Environment): Environment {
  const nodeEnv = (config.NODE_ENV ?? 'development').trim().toLowerCase();

  if (!NODE_ENVS.has(nodeEnv)) {
    throw new Error(
      `NODE_ENV inválido: ${nodeEnv}. Use development, test, staging ou production.`,
    );
  }

  required(config, 'DATABASE_URL');

  const accessSecret = validateSecret(config, 'JWT_ACCESS_SECRET', nodeEnv);
  const refreshSecret = validateSecret(config, 'JWT_REFRESH_SECRET', nodeEnv);

  if (accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET e JWT_REFRESH_SECRET devem ser diferentes.');
  }

  const portValue = config.PORT?.trim();
  if (portValue) {
    const port = Number(portValue);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT deve ser um número inteiro entre 1 e 65535.');
    }
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
  };
}
