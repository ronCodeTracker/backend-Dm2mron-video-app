const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORTONE = process.env.PORTONE || 3000;
const upload = multer(); // for parsing multipart/form-data

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});

// --- HIGHLIGHTED: Test DB connection and log result ---
pool.getConnection()
  .then(conn => {
    console.log('✅ Connected to MySQL database!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Unable to connect to MySQL database:', err.message);
  });


// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// CREATE: Upload video chunk (call this for each chunk)
app.post('/uploadChunk', upload.single('video'), async (req, res) => {
  const { name, category, chunkIndex, totalChunks, videoId } = req.body;
  const chunkData = req.file && req.file.buffer;
  if (!name || !category || chunkIndex === undefined || !chunkData) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let vid = videoId;
    // On first chunk, create the video record
    if (!vid && chunkIndex == 0) {
      const [result] = await pool.query(
        'INSERT INTO videos (name, category, created_at) VALUES (?, ?, NOW())',
        [name, category]
      );
      vid = result.insertId;
    } else if (!vid) {
      // Find videoId by name and category (fallback)
      const [rows] = await pool.query(
        'SELECT id FROM videos WHERE name = ? AND category = ? ORDER BY created_at DESC LIMIT 1',
        [name, category]
      );
      vid = rows[0]?.id;
    }

    // Insert chunk
    await pool.query(
      'INSERT INTO video_chunks (video_id, chunk_index, chunk_data) VALUES (?, ?, ?)',
      [vid, chunkIndex, chunkData]
    );

    // If last chunk, respond with success
    if (parseInt(chunkIndex) + 1 === parseInt(totalChunks)) {
      return res.json({ message: 'Upload complete', videoId: vid });
    }
    res.json({ message: 'Chunk uploaded', videoId: vid });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    res.status(500).json({ message: 'Error uploading chunk' });
  }
});

// READ: Get all videos
app.get('/getAllVideos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, category, created_at FROM videos');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
});

// READ: Get video by ID (streams video)
app.get('/getVideoById', async (req, res) => {
  const id = req.query.id;
  try {
    const [video] = await pool.query('SELECT * FROM videos WHERE id = ?', [id]);
    if (video.length === 0) return res.status(404).json({ message: 'Video not found' });

    const [chunks] = await pool.query(
      'SELECT chunk_data FROM video_chunks WHERE video_id = ? ORDER BY chunk_index ASC',
      [id]
    );
    if (chunks.length === 0) return res.status(404).json({ message: 'No chunks found for this video' });

    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Transfer-Encoding': 'chunked',
    });
    chunks.forEach((chunk) => res.write(chunk.chunk_data));
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error retrieving video' });
  }
});

// UPDATE: Update video metadata
app.put('/videos/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;
  if (!name && !category) {
    return res.status(400).json({ message: 'At least one field (name or category) is required' });
  }
  try {
    const fields = [];
    const values = [];
    if (name) { fields.push('name = ?'); values.push(name); }
    if (category) { fields.push('category = ?'); values.push(category); }
    values.push(id);
    const [result] = await pool.query(
      `UPDATE videos SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Video not found' });
    res.json({ message: 'Video updated' });
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: 'Error updating video' });
  }
});

// DELETE: Delete a video and its chunks
app.delete('/videos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM video_chunks WHERE video_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM videos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Video not found' });
    res.json({ message: 'Video and its chunks deleted' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Error deleting video' });
  }
});

// Start the server
app.listen(PORTONE, () => {
  console.log(`Server is running on http://localhost:${PORTONE}`);
});