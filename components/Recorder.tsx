"use client";  // これを追加

import { useState, useRef, useEffect } from 'react';

const Recorder = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [latestAudioUrl, setLatestAudioUrl] = useState<string | null>(null);
  const [allAudioUrl, setAllAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const allAudioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [allAudioTranscript, setAllAudioTranscript] = useState<string | null>(null);

  const startRecording = async () => {
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

  return (
    <div className="flex flex-col items-center">
      <div>
        <button
          onClick={startRecording}
          className="px-4 py-2 mt-5 text-white bg-blue-500 rounded hover:bg-blue-700"
          disabled={recording}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          className="px-4 py-2 mt-5 ml-2 text-white bg-red-500 rounded hover:bg-red-700"
          disabled={!recording}
        >
          Stop Recording
        </button>
      </div>
      <p className="mt-3 text-xl">{transcript}</p>

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
    </div>
  );
};

export default Recorder;
