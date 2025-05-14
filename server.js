
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});

// Middleware for parsing JSON
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Route: Get Video by ID
app.get('/getVideoById', async (req, res) => {
  const id = req.query.id;
  console.log('Received request for video ID:', id);

  try {
    const [video] = await pool.query('SELECT * FROM videos WHERE id = ?', [id]);
    if (video.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const [chunks] = await pool.query(
      'SELECT chunk_data FROM video_chunks WHERE video_id = ? ORDER BY chunk_index ASC',
      [id]
    );

    if (chunks.length === 0) {
      return res.status(404).json({ message: 'No chunks found for this video' });
    }

    // Stream the video chunks
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
    });

    chunks.forEach((chunk) => {
      res.write(chunk.chunk_data);
    });

    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error retrieving video' });
  }
});

// Route: Get All Videos
app.get('/getAllVideos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, category, created_at FROM videos');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


