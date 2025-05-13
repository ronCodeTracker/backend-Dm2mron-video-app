


const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});

exports.handler = async (event) => {
  const { name, category, chunkIndex, totalChunks } = JSON.parse(event.body);
  const chunk = Buffer.from(event.body.chunk, 'base64'); // Decode base64 chunk

  try {
    const [video] = await pool.query(
      'SELECT id FROM videos WHERE name = ? AND category = ?',
      [name, category]
    );

    let videoId;
    if (video.length === 0 && chunkIndex === '0') {
      const [result] = await pool.query(
        'INSERT INTO videos (name, category) VALUES (?, ?)',
        [name, category]
      );
      videoId = result.insertId;
    } else {
      videoId = video[0]?.id;
    }

    await pool.query(
      'INSERT INTO video_chunks (video_id, chunk_index, chunk_data) VALUES (?, ?, ?)',
      [videoId, chunkIndex, chunk]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Chunk uploaded successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error uploading video chunk' }),
    };
  }
};
