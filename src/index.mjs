import io from './config/Socket/SocketServer.mjs';
import express from 'express';
import app from './routes/app.mjs';
import envConstant from './constant/env.constant.mjs';
import validateEnv from './validation/Env.Validation.mjs';
import { db_connect } from './config/Db.config.mjs';
import path from 'path';

// import cron from 'node-cron';

import session from 'express-session';

import cookieParser from 'cookie-parser';
import lolcat from 'lolcatjs';

import cors from 'cors';

import { fileURLToPath } from 'url';
import SocketEvent from './config/Socket/SocketEvent.mjs';
import Socket_Middleware from './config/Socket/SocketMiddleWare.mjs';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const whitelist = new Set([envConstant.FRONTEND_URL, 'http://localhost:5173']);

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.has(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.static(path.join(path.resolve(), 'public')));
app.use(
  '/api/images',
  express.static(path.join(path.resolve(), 'public', 'images'))
);

app.use((req, res, next) => {
  lolcat.fromString(`Incoming request: ${req.method} ${req.url}`);
  next();
});

io.on('connection', (socket) => SocketEvent(socket));
io.use((socket, next) => Socket_Middleware(socket, next));

app.use((err, req, res, next) => {
  if (err) {
    console.error(err.stack);
    res.status(500).send(err.message || 'Something broke!');
  }

  next();
});

// Define Swagger options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API Documentation',
      version: '1.0.0',
      description:
        'Automatically generated API documentation for Express routes',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.mjs'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Add Swagger UI route before app.listen
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns a list of users
 *     description: Optional extended description
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The user ID.
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: The user's name.
 *                     example: Leanne Graham
 */
app.get('/users', (req, res) => {
  // Your route logic here
});
