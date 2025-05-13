


//const fs = require('fs');
//const path = require('path');
const db = require('../models/dbMysql');


//const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
//if (!fs.existsSync(uploadDir)) {
//  fs.mkdirSync(uploadDir);
//}


// Create a new video
//const db = require('../models/db');

// Create a new video (chunked upload)
exports.createVideo = async (req, res) => {
  const { name, category, chunkIndex, totalChunks } = req.body;
  const chunk = req.file.buffer;

  try {
    // Store the chunk in the database
    const [video] = await db.query(
      'SELECT id FROM videos WHERE name = ? AND category = ?',
      [name, category]
    );

    let videoId;
    if (video.length === 0 && chunkIndex === '0') {
      // Create a new video entry if it doesn't exist
      const [result] = await db.query(
        'INSERT INTO videos (name, category) VALUES (?, ?)',
        [name, category]
      );
      videoId = result.insertId;
    } else {
      videoId = video[0]?.id;
    }

    // Insert the chunk into the video_chunks table
    await db.query(
      'INSERT INTO video_chunks (video_id, chunk_index, chunk_data) VALUES (?, ?, ?)',
      [videoId, chunkIndex, chunk]
    );

    // Check if all chunks are uploaded
    const [uploadedChunks] = await db.query(
      'SELECT COUNT(*) AS count FROM video_chunks WHERE video_id = ?',
      [videoId]
    );

    if (uploadedChunks[0].count === parseInt(totalChunks)) {
      return res.status(200).json({ message: 'Video uploaded successfully' });
    }

    res.status(200).json({ message: 'Chunk uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading video chunk' });
  }
};


// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, category, created_at FROM videos');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching videos' });
  }
};

exports.getVideoById = async (req, res) => {
  const { id } = req.params;

  try {
    // Retrieve video metadata
    const [video] = await db.query('SELECT * FROM videos WHERE id = ?', [id]);
    if (video.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Retrieve all chunks for the video
    const [chunks] = await db.query(
      'SELECT chunk_data FROM video_chunks WHERE video_id = ? ORDER BY chunk_index ASC',
      [id]
    );

    if (chunks.length === 0) {
      return res.status(404).json({ message: 'No chunks found for this video' });
    }

    // Combine all chunks into a single buffer
    const videoBuffer = Buffer.concat(chunks.map((chunk) => chunk.chunk_data));

    // Send the video as a response
    res.setHeader('Content-Type', 'video/mp4');
    res.send(videoBuffer);
  } catch (error) {
    console.error('Error retrieving video:', error);
    res.status(500).json({ message: 'Error retrieving video' });
  }
};



// Update a video
exports.updateVideo = async (req, res) => {
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

// Delete a video
exports.deleteVideo = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM videos WHERE id = ?', [id]);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting video' });
  }
};


