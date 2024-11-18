// controllers/voiceController.js
const fs = require('fs');
const { spawn } = require('child_process');
const vosk = require('vosk');

// モデルパスと設定
const MODEL_PATH = 'model';
const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4000;

if (!fs.existsSync(MODEL_PATH)) {
  console.error("Please download the model and unpack as 'model' folder");
  process.exit();
}

const model = new vosk.Model(MODEL_PATH);


exports.recognizeAudio = (req, res) => {
  const filePath = req.file.path;

  const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });
  const ffmpeg_run = spawn('ffmpeg', ['-loglevel', 'quiet', '-i', filePath,
                                       '-ar', String(SAMPLE_RATE), '-ac', '1',
                                       '-f', 's16le', '-bufsize', String(BUFFER_SIZE), '-']);

  let resultText = '';

  ffmpeg_run.stdout.on('data', (stdout) => {
    if (rec.acceptWaveform(stdout)) {
      resultText += rec.result().text;
    } else {
      resultText += rec.partialResult().partial;
    }
  });

  ffmpeg_run.on('close', () => {
    resultText += rec.finalResult().text;
    rec.free();
    fs.unlinkSync(filePath); // 一時ファイルを削除
    res.json({ message: 'Audio file processed successfully!', content: resultText });
  });

  ffmpeg_run.on('error', (error) => {
    console.error('Error during audio processing:', error);
    rec.free();
    fs.unlinkSync(filePath);
    res.status(500).json({ message: 'Failed to process audio file.' });
  });
};
