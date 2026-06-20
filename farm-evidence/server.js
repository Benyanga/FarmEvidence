const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const connectDB  = require('./server/config/db');
require('dotenv').config();

const app = express();

// Security headers
app.use(helmet());

// CORS — allow dev and production origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5178',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect DB
connectDB();

// Routes
// Legacy auth routes removed — authentication is now handled by Clerk in server/index.js
// app.use('/api/auth',          require('./routes/auth'));
app.use('/api/trials',        require('./routes/trials'));
app.use('/api/plots',         require('./routes/plots'));
app.use('/api/farms',         require('./routes/farms'));
app.use('/api/farm-analysis', require('./routes/farmAnalysis'));
app.use('/api/analysis',      require('./routes/analysis'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/seasons',       require('./routes/seasons'));

// Health check (required by Render and AWS ELB)
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`FarmEvidence API running on port ${PORT} [${process.env.NODE_ENV}]`));
