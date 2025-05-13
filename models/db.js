

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'db-mysql-nyc3-78333-do-user-22139665-0.i.db.ondigitalocean.com',
  user: 'doadmin',
  password: 'AVNS_0jj3Y_0hiqivfBRHzNZ',
  database: 'video_app',
  port: 25060
});

// Test the database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful!');
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // Exit the application with an error code
  }
})();



module.exports = pool;


