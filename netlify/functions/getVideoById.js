



const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});

const http = require('http');

exports.handler = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Method Not Allowed' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  console.log('Received request for video ID:', id);

  try {
    const [video] = await pool.query('SELECT * FROM videos WHERE id = ?', [id]);
    if (video.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Video not found' }));
      return;
    }

    const [chunks] = await pool.query(
      'SELECT chunk_data FROM video_chunks WHERE video_id = ? ORDER BY chunk_index ASC',
      [id]
    );

    if (chunks.length === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'No chunks found for this video' }));
      return;
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
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Error retrieving video' }));
  }
};