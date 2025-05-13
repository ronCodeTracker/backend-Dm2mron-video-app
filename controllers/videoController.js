



const db = require('../models/db');

// Create a new video
exports.createVideo = async (req, res) => {
  const { name, category } = req.body;
  const videoData = req.file?.buffer;

  if (!name || !category || !videoData) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO videos (name, category, video_data) VALUES (?, ?, ?)',
      [name, category, videoData]
    );
    res.status(201).json({ message: 'Video uploaded successfully', videoId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading video' });
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

// Get a video by ID
exports.getVideoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM videos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const video = rows[0];
    res.setHeader('Content-Type', 'video/mp4');
    res.send(video.video_data);
  } catch (error) {
    console.error(error);
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


