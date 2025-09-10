const environment = {
  NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  REFRESH_TOKEN_MINUTES: process.env.NEXT_PUBLIC_REFRESH_TOKEN_MINUTES || 50,
};

export default environment;
