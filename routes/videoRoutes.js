

const express = require('express');
const multer = require('multer');
const videoController = require('../controllers/videoController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// CRUD routes
router.post('/', upload.single('video'), videoController.createVideo);
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);
router.put('/:id', upload.single('video'), videoController.updateVideo);
router.delete('/:id', videoController.deleteVideo);

module.exports = router;

