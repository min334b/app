import Head from 'next/head';
import Recorder from '../../../components/Recorder';
import FileUploader from '../../../components/FileUploader';
import RecordAnalysis from '../../../components/RecordAnalysis';
import SLMtest from '../../../components/SLMtest';


export default async function Home() {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
            model: "llama3",
            prompt: "Hello",
            stream: false
        }),
    });
    if (!response.ok) {
        console.error(response.statusText);
        return <div>Failed to fetch</div>;
    }
    console.log(response)
      const data = await response.json();
      console.log(data)
    return (
        <main className="flex flex-col items-center justify-start w-full text-center">
            <h1 className="text-6xl font-bold mt-0">補助資料提示システム</h1>
            <div>{data.response}</div>
            <SLMtest />
        </main>
    );
}
