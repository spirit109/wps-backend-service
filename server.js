require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares ---
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// --- Routes ---
app.get('/', (req, res) => {
  res.send('WPS Integration Backend Service is running.');
});
app.use('/auth', authRoutes);
app.use('/api', authMiddleware, apiRoutes); // Protect all API routes

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({ error: { message } });
});

app.listen(PORT, () => {
    console.log(`Server is running on https://wps-backend-service.vercel.app`);

});
