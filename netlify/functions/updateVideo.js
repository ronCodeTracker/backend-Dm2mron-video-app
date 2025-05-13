



const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});



// Update a video
exports.handler = async (event) => {
  const { id } = req.params;
  const { name, category } = req.body;
  const videoData = req.file?.buffer;

  if (!name || !category || !videoData) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await db.query(
      'UPDATE videos SET name = ?, category = ?, video_data = ? WHERE id = ?',
      [name, category, videoData, id]
    );
    res.json({ message: 'Video updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating video' });
  }
};



