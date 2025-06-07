const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const Database = require('./database');
const createRoutes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './data/ideas.db';

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize database and routes
async function initializeApp() {
  try {
    const database = new Database(DB_PATH);
    await database.init();
    
    // Add routes
    app.use(createRoutes(database));
    
    // Error handling middleware
    app.use((error, req, res, next) => {
      console.error('Error:', error);
      if (error.name === 'MulterError') {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    });
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Ideas webapp running on port ${PORT}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await database.close();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await database.close();
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  initializeApp();
}

module.exports = app;

