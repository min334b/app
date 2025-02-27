import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerateContentRequest, Part } from '@google/generative-ai';

import formidable from 'formidable';
import fs from 'fs';
const mime = require("mime-types");
import path from 'path';
import { exec } from 'child_process';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export const config = {
  api: {
    bodyParser: false,
  },
};

const prompt = `この音声ファイルは，生徒が，講師に質問に来た時の音声です．
  この音声の内容と，テーマが少し異なるweb画像を検索するための検索ワードを5つ出力してください．
  その際，音声の中に含まれるキーワードの後ろに，「景色」「名所」「被害」「日本」「地域」をそれぞれ付け加えた検索ワードを出力してください．ただし，この5つの順番はランダムにしてください．
  具体例を示します．以下の検索ワードは，「フェーン現象とは何なのか，なぜ起こるのか」
  が理解できない生徒の音声に対する外れたweb画像を検索するための検索ワードの出力です．この形式に従って，これくらいのテーマの違いで出力してください．
  検索ワード以外の出力はしないでください．

  フェーン現象 景色,フェーン現象 名所,フェーン現象 被害,フェーン現象 日本,フェーン現象 地域
  `

  // その際，音声の中に含まれるキーワードを含まないような検索ワードを出力してください．
  // ["3次関数 増減 グラフ", "3次関数 極値 グラフ 描き方", "導関数 極値", "増減表 グラフ", "導関数 増減表"]


//   この音声ファイルは，生徒が，講師に質問に来た時の音声です．
// この音声の内容とは全く異なるweb画像を検索するための検索ワードを出力してください．
// ただし，5つ出力してください．
// 具体例を示します．以下の検索ワードは，「フェーン現象とは何なのか，なぜ起こるのか」
// が理解できない生徒の音声に対する外れたweb画像を検索するための検索ワードの出力です．この形式に従って，これくらいのテーマの違いで出力してください．
// 検索ワード以外の出力はしないでください．

// フェーン現象 景色,フェーン現象 名所,フェーン現象 被害,フェーン現象 日本,フェーン現象 地域


function convertAudioToBase64(file: any) {
  try {
    console.log("file", file.type);
    return Buffer.from(file.arrayBuffer()).toString("base64");
  } catch (error) {
    console.log(error);
  }
}


const checkIfBase64 = (str: string) => {
  const base64Pattern = /^[a-zA-Z0-9+/]+={0,2}$/;
  const base64Length = str.length % 4 === 0;
  return base64Pattern.test(str) && base64Length;
};

export const POST = async (req: NextRequest) => {


  // client →　ファイルを受け取る →　ファイルをそのままgeminiに送る
  // client →　サーバーに保存 → URLをgeminiに送る

  // https://github.com/dbanswan/gemini-ai-processaudio-js/blob/main/app.js
  try {
    // body: JSON.stringify({ audioData: audioBase64, type: 'latest' })を受け取る
    const { audioData, type } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData:
            { data: audioData, mimeType: "audio/wav" }
      },
    ]);
    const response = await result.response;

    // let text = await generateTextFromAudio(audio, audioAll);
    const text = response.text();
    console.log(text);

    return NextResponse.json({ message: 'Audio file uploaded successfully!', content: text });
  } catch (error) {
    console.error('Ocuring Error:', error);
    return NextResponse.json({ message: 'Failed.' }, { status: 500 });
    // res.status(405).json({ error: 'Method not allowed' });
  }
};
