
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});




// Get all videos
exports.handler = async (event) => {
  try {
    const [rows] = await db.query('SELECT id, name, category, created_at FROM videos');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};




