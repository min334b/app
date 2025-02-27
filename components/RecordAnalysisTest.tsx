"use client";  // これを追加

import { useState, useRef, useEffect } from 'react';
import useRenderImages from '../hooks/useRenderImages';
import useRenderImageskeywords from '../hooks/useRenderImageskeywords';

const RecordAnalysisTest = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [latestAudioUrl, setLatestAudioUrl] = useState<string | null>(null);
  const [allAudioUrl, setAllAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const allAudioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [allAudioTranscript, setAllAudioTranscript] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [output, setOutput] = useState<string | null>(null);
  const { renderImages } = useRenderImages();
  const { renderImageskeywords } = useRenderImageskeywords();
  const [enterCount, setEnterCount] = useState(0);
  const [onrecording, setOnrecording] = useState(false);
  const [dummy, setDummy] = useState(false); // true: ダミーapi，false: 通常api
  const tmpkeywords = ['熱力学第一法則　公式','熱力学第一法則　内部エネルギー','熱力学第一法則　例題','熱力学第一法則　図解','熱力学第一法則　状態変化'];

  const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        if (onrecording === false) {
            startRecording();
            setOnrecording(true);
        } else {
            stopRecording();
            setOnrecording(false);
        }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleEnterKey);
    return () => {
      window.removeEventListener('keydown', handleEnterKey);
    };
  }, []);

  const startRecording = async () => {
    setDummy(false); // 通常apiを呼び出す
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    allAudioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
      allAudioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      saveFinalRecording();
    };

    mediaRecorder.start();
    setRecording(true);

    intervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        saveIntervalRecording();
        mediaRecorderRef.current.start();
        audioChunksRef.current = [];
      }
    }, 10000);
  };

  const startRecordingDummy = async () => {
    setDummy(true); // ダミーapiを呼び出す
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    allAudioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
      allAudioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      saveFinalRecording();
    };

    mediaRecorder.start();
    setRecording(true);

    intervalRef.current = setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        saveIntervalRecording();
        mediaRecorderRef.current.start();
        audioChunksRef.current = [];
      }
    }, 10000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      clearInterval(intervalRef.current!);
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const saveIntervalRecording = () => {
    const latestAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const latestAudioUrl = URL.createObjectURL(latestAudioBlob);
    setLatestAudioUrl(latestAudioUrl);
    saveAudio(latestAudioBlob, 'latest');

    const allAudioBlob = new Blob(allAudioChunksRef.current, { type: 'audio/wav' });
    const allAudioUrl = URL.createObjectURL(allAudioBlob);
    setAllAudioUrl(allAudioUrl);
    saveAudio(allAudioBlob, 'all');
  };

  const saveFinalRecording = () => {
    const latestAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const latestAudioUrl = URL.createObjectURL(latestAudioBlob);
    setLatestAudioUrl(latestAudioUrl);
    saveAudio(latestAudioBlob, 'latest');

    const allAudioBlob = new Blob(allAudioChunksRef.current, { type: 'audio/wav' });
    const allAudioUrl = URL.createObjectURL(allAudioBlob);
    setAllAudioUrl(allAudioUrl);
    saveAudio(allAudioBlob, 'all');
  };

  const saveAudio = async (audioBlob: Blob, type: string) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob); // convert to base64 string
    reader.onloadend = async () => {
      const base64data = reader.result;
      await fetch('/api/audio-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64data,
          type: type,
        }),
      });
    };
  };

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    return base64Audio;
  };

  const processKeyword = (keyword: any) => {
    renderImages(keyword);
    console.log(`Processing: ${keyword}`);
  };

  const processKeywords = (keywords: any) => {
    renderImageskeywords(keywords);
    console.log(`Processingkeywords: ${keywords}`);
  };

  const handleNext = () => {
    if (currentIndex < keywords.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    const processAllAudio = async () => {
        let result: {  message: string, content: string  } = { message: '', content: '' };
        if (allAudioUrl) {
          if (dummy) { // ダミーapiを呼び出す
            try {
              // URLからbase64へ変換
              const audioBase64 = await convertUrlToBase64(allAudioUrl);

              // 変換したbase64データをAPIに送信
              const response = await fetch('/api/process-all-audio-dummy', {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ audioData: audioBase64, type: 'all' }),
              });
              result = await response.json();
              } catch (error) {
              console.error("Error:", error);
              }
          }
          else { // 通常apiを呼び出す
            try {
              // URLからbase64へ変換
              const audioBase64 = await convertUrlToBase64(allAudioUrl);

              // 変換したbase64データをAPIに送信
              const response = await fetch('/api/process-all-audio', {
                  method: 'POST',
                  headers: {
                  'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ audioData: audioBase64, type: 'all' }),
              });
              result = await response.json();
              } catch (error) {
              console.error("Error:", error);
              }
          }
        }
        setCurrentIndex(0);
        setOutput(result.content);
        console.log("result", result);
        console.log("content", result.content);
        setKeywords(result.content.split(','));
    };
    processAllAudio();
  }, [allAudioUrl]);

  useEffect(() => {
    console.log("Updated keywords:", keywords);
    processKeywords(keywords);
  }, [keywords]); // keywordsが更新されるたびに実行

  return (
    <div className="flex flex-col items-center">
      <div>
        <button
          onClick={startRecording}
          className="px-4 py-2 mt-5 text-white bg-blue-500 rounded hover:bg-blue-700"
          disabled={recording}
        >
          Start
        </button>
        <button
          onClick={startRecordingDummy}
          className="px-4 py-2 mt-5 text-white bg-blue-500 rounded hover:bg-blue-700"
          disabled={recording}
        >
          Recording
        </button>
        <button
          onClick={stopRecording}
          className="px-4 py-2 mt-5 ml-2 text-white bg-red-500 rounded hover:bg-red-700"
          disabled={!recording}
        >
          StopRecording
        </button>
      </div>
      <p className="mt-3 text-xl">{transcript}</p>

      {/* 検索ワードを表示 */}
      {allAudioTranscript && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">All Transcripts</h2>
          <p>{allAudioTranscript}</p>
        </div>
      )}

      <div className="mt-4">
        {latestAudioUrl && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Latest 10 Seconds</h2>
            <audio controls src={latestAudioUrl}></audio>
            <div className="mt-2">
              <a
                href={latestAudioUrl}
                download="audio.wav"
                className="px-4 py-2 mt-2 text-white bg-green-500 rounded hover:bg-green-700"
              >
                Download Latest Recording
              </a>
              <button
                onClick={() => window.open(latestAudioUrl)}
                className="px-4 py-2 mt-2 ml-2 text-white bg-blue-500 rounded hover:bg-blue-700"
              >
                Play Latest Recording
              </button>
            </div>
          </div>
        )}
        {allAudioUrl && (
          <div>
            <h2 className="text-lg font-semibold">All Recordings</h2>
            <audio controls src={allAudioUrl}></audio>
            <div className="mt-2">
              <a
                href={allAudioUrl}
                download="audio_all.wav"
                className="px-4 py-2 mt-2 text-white bg-green-500 rounded hover:bg-green-700"
              >
                Download All Recordings
              </a>
              <button
                onClick={() => window.open(allAudioUrl)}
                className="px-4 py-2 mt-2 ml-2 text-white bg-blue-500 rounded hover:bg-blue-700"
              >
                Play All Recordings
              </button>
            </div>
          </div>
        )}
      </div>
      {output && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Output</h2>
          <pre className="p-4 bg-gray-100 rounded">{output}</pre>
        </div>
      )}
      <div>
        次のキーワード: {keywords[currentIndex]}
      </div>
      <button
        onClick={() => {
          processKeyword(keywords[currentIndex]);
          handleNext();
        }}
        disabled={currentIndex >= keywords.length}
        style={{
          backgroundColor: currentIndex >= keywords.length ? 'grey' : 'blue',
          cursor: currentIndex >= keywords.length ? 'not-allowed' : 'pointer'
        }}
      >
        次に進む
      </button>
    </div>
  );
};

export default RecordAnalysisTest;
