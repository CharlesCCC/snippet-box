import { join } from 'path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { Logger } from './utils';
import { connectDB } from './db';
import { errorHandler } from './middleware';
import cookieParser from 'cookie-parser';

// Routers
import { snippetRouter } from './routes/snippets';
import authRouter from './routes/auth';
import savedRouter from './routes/saved';
import likesRouter from './routes/likes';
import { associateModels } from './db/associateModels';

// Env config
dotenv.config({ path: './src/config/.env' });

const app = express();
const logger = new Logger('server');
const PORT = process.env.PORT || 5000;

// App config
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/snippets', snippetRouter);
app.use('/api/auth', authRouter);
app.use('/api/saved', savedRouter);
app.use('/api/likes', likesRouter);

// Serve static files
app.use(express.static(join(__dirname, '../public')));

// Serve client code for any non-API route
// This should be after API routes to ensure they take precedence
app.get('*', (req: Request, res: Response) => {
  // Only serve the index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(join(__dirname, '../public/index.html'));
  }
});

// Error handler
app.use(errorHandler);

(async () => {
  await connectDB();
  await associateModels();

  app.listen(PORT, () => {
    logger.log(
      `Server is working on port ${PORT} in ${process.env.NODE_ENV} mode`
    );
  });
})();
