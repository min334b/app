// server.js
const express = require('express');
const app = express();
const voiceRoutes = require('./routes/voice');

const PORT = process.env.PORT || 3000;

// 音声認識APIのルートを設定
app.use('/api/voice', voiceRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
