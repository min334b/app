// "use client";
// import { useState } from 'react';
// import useRenderImages from '../hooks/useRenderImages';
// import { get } from 'http';


// const SLMtest = () => {
//   const [files, setFiles] = useState<File[]>([]);
//   const [output, setOutput] = useState<string | null>(null);
//   const { renderImages } = useRenderImages();
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [keywords, setKeywords] = useState<string>();
//   const [audioFilePath, setAudioFilePath] = useState('');
//   const [transcription, setTranscription] = useState('');

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files) {
//       setFiles(Array.from(event.target.files));
//     }
//   };

//   const handleTranscribe = async () => {
//     const response = await fetch('/api/transcribe', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ audioFilePath }),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       setTranscription(data.text);
//     } else {
//       console.error(data.error);
//     }
//   };

//   const processKeyword = (keyword: any) => {
//     renderImages(keyword);
//     console.log(`Processing: ${keyword}`);
//   };

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();

//     const formData = new FormData();
//     for(let i = 0; i < files.length; i++) {
//         formData.append('files', files[i]);
//     }
//     console.log("files", files);
//     console.log("formData", formData);

//     const response = await fetch('/api/whisper-llama', {
//       method: 'POST',
//       body: JSON.stringify({ files: files }),
//     });

//     setCurrentIndex(0);
//     const result = await response.json();
//     setOutput(result.content);
//     console.log("result", result);
//     console.log("content", result.content);
//     setKeywords(result.content);
//     // console.log("keywords", keywords);
//   };

//   return (
//     <div className="flex flex-col items-center">
//       <form onSubmit={handleSubmit} className="flex flex-col items-center mt-4">
//         <input
//           type="file"
//           multiple
//           // wav
//           // accept="image/*,application/pdf,wav"
//           accept='audio/*,image/*,application/pdf'
//           onChange={handleFileChange}
//           className="mb-4"
//         />
//         <button
//           type="submit"
//           className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
//         >
//           解析開始
//         </button>
//       </form>
//       {output && (
//         <div className="mt-4">
//           <h2 className="text-lg font-semibold">Output</h2>
//           <pre className="p-4 bg-gray-100 rounded">{output}</pre>
//         </div>
//       )}
//       <div>
//         次のキーワード: {keywords}
//       </div>
//       <div>
//         <input
//             type="text"
//             value={audioFilePath}
//             onChange={(e) => setAudioFilePath(e.target.value)}
//             placeholder="Enter audio file path"
//         />
//         <button onClick={handleTranscribe}>Transcribe</button>
//         <p>Transcription: {transcription}</p>
//         </div>
//     </div>
//   );
// };

// export default SLMtest;
'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
//   let prompt = `以下の文章は英語について話していますか？英語について話している場合は1を，そうでない場合は0を出力してください．
//   「1」または「0」以外の出力は行わないでください．

//   `
  const default_prompt = `以下の文章は，講師と生徒の会話です．
  この会話内容から，講師が生徒に対して授業を行っているかどうかを判断してください．雑談など，授業とは関係のない話をしている場合は，授業を行っていないと判断してください．
  授業を行っている場合は1を，授業を行っていない場合は0を出力してください．講師と生徒の会話が無い場合は0を出力してください．「1」または「0」以外の出力は行わないでください．

  `

  const test_prompt = ``

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    let prompt = default_prompt
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // 音声データをWhisperに送信
    // 入力：音声データ，出力：音声認識結果
    try {
      const response = await fetch('/api/whisper', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        try {
          // デコード処理でエラーが発生しても安全にスキップ
          const decodedText = JSON.parse(`"${data.content.replace(/"/g, '\\"')}"`);
          setTranscription(decodedText);
          prompt += test_prompt;
          //prompt += decodedText;
          console.log(prompt);
        } catch (decodeError) {
          console.warn('Decoding error, returning raw content:', decodeError);
          // デコードエラー時には生データをセット
          setTranscription(data.content);
        }
      } else {
        setError(data.message || 'Failed to upload file');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('An error occurred while uploading the file.');
    }

    // 音声認識結果を加えたpromptをllamaに送信
    // 入力：テキストデータ，出力："0" or "1" or else(何らかの文字列)
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
            model: "llama3",
            prompt: prompt,
            stream: false
        }),
    });
    if (!response.ok) {
        console.error(response.statusText);
        return <div>Failed to fetch</div>;
    }
    console.log(response);
    const data = await response.json();
    console.log(data);
    console.log(data.response);


    if (data.response === "0") {
        console.log("data.response === 0");
    }
    else if (data.response === "1") {
        console.log("data.response === 1");
    }
    else {
        console.log("data.response === else");
    }
  };

  return (
    <div>
      <h1>Upload Audio File</h1>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Transcribe</button>
      {transcription && <p>Transcription: {transcription}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
