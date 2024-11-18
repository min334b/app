"use client";
import { useState } from 'react';
import useRenderImages from '../hooks/useRenderImages';
import { get } from 'http';


const SLMtest = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [output, setOutput] = useState<string | null>(null);
  const { renderImages } = useRenderImages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keywords, setKeywords] = useState<string>();



  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const processKeyword = (keyword: any) => {
    renderImages(keyword);
    console.log(`Processing: ${keyword}`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    for(let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    console.log("files", files);
    console.log("formData", formData);

    const response = await fetch('/api/voice/recognize', {
      method: 'POST',
      body: formData,
    });

    setCurrentIndex(0);
    const result = await response.json();
    setOutput(result.content);
    console.log("result", result);
    console.log("content", result.content);
    setKeywords(result.content);
    // console.log("keywords", keywords);
  };

  return (
    <div className="flex flex-col items-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center mt-4">
        <input
          type="file"
          multiple
          // wav
          // accept="image/*,application/pdf,wav"
          accept='audio/*,image/*,application/pdf'
          onChange={handleFileChange}
          className="mb-4"
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          解析開始
        </button>
      </form>
      {output && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Output</h2>
          <pre className="p-4 bg-gray-100 rounded">{output}</pre>
        </div>
      )}
      <div>
        次のキーワード: {keywords}
      </div>
    </div>
  );
};

export default SLMtest;
