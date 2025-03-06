declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: number;
      NODE_ENV: string;
      POSTGRES_URL: string;
      RESEND_API_KEY: string;
      RESEND_AUTHORIZED_EMAIL: string;
      JWT_SECRET?: string;
      JWT_EXPIRE?: string;
      JWT_COOKIE_EXPIRE?: string;
    }
  }
}

export {};
