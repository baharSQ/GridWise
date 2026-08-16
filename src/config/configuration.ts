type AppConfig = {
  app: {
    port: number;
  };
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  jwt: {
    secret: string;
  };
};

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function readRequired(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default (): AppConfig => ({
  app: {
    port: parseNumber(process.env.PORT, 3000),
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseNumber(process.env.DB_PORT, 1433),
    name: readRequired(process.env.DB_DATABASE, 'DB_DATABASE'),
    username: readRequired(process.env.DB_USERNAME, 'DB_USERNAME'),
    password: readRequired(process.env.DB_PASSWORD, 'DB_PASSWORD'),
  },
  jwt: {
    secret: readRequired(process.env.JWT_SECRET, 'JWT_SECRET'),
  },
});
