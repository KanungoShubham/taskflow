const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
// The Next.js client proxies /api to this server, so CORS is only needed
// when the client is served from a different origin (CLIENT_URL).
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api', apiRoutes);
app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
