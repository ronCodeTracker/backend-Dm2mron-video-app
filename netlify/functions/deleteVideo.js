



const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DATABASE_URL,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.PORT,
});





// Delete a video
exports.handler = async (event) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM videos WHERE id = ?', [id]);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting video' });
  }
};



