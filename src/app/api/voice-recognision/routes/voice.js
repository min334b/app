// routes/voice.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const voiceController = require('../controllers/voiceController');

// ファイルアップロード設定（multerを使用）
const upload = multer({ dest: 'uploads/' });

// POSTリクエストで音声ファイルを処理
router.post('/recognize', upload.single('audio'), voiceController.recognizeAudio);

module.exports = router;
