import Head from 'next/head';
import RecordAnalysisTest from '../../../components/RecordAnalysisTest';


export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start">
    <Head>
      <title>Record Voice and Analysis</title>
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <main className="flex flex-col items-center justify-start w-full text-center">
      <h1 className="text-6xl font-bold mt-0">補助資料提示システム</h1>
      <RecordAnalysisTest />
    </main>

      {/* <footer className="flex items-center justify-center w-full h-24 border-t">
        <a
          className="flex items-center justify-center"
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className="h-4 ml-2" />
        </a>
      </footer> */}
    </div>
  );
}
