# whisper_transcribe.py
import whisper
import sys
import json

# Whisperモデルをロード
model = whisper.load_model("base")

# 音声ファイルのパスを取得
audio_file = sys.argv[1]

# 音声をテキスト化
result = model.transcribe(audio_file)

# 結果をJSONで出力
print(json.dumps(result["text"]))
