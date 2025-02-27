import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerateContentRequest, Part } from '@google/generative-ai';

// import formidable from 'formidable';
// import fs from 'fs';
const mime = require("mime-types");
// import path from 'path';
// import { exec } from 'child_process';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export const config = {
  api: {
    bodyParser: false,
  },
};

const prompt = `この音声ファイルは，生徒が，講師に質問に来た時の音声です．
  生徒個々人の問題点に特化して，内容の理解を促進するようなweb画像を検索するための検索ワードを出力してください．
  ただし，検索ワードは有効性が高いと思われるものから順番に5つ出力してください．
  具体例を示します．以下の検索ワードは，「3次関数の増減，極値を求め，グラフを描く問題」
  が理解できない生徒のためのweb画像を検索するための検索ワードの出力です．この形式に従って出力してください．検索ワード以外の出力はしないでください．

  3次関数 増減 グラフ,3次関数 極値 グラフ 描き方,導関数 極値,増減表 グラフ,導関数 増減表
  `
  // ["3次関数 増減 グラフ", "3次関数 極値 グラフ 描き方", "導関数 極値", "増減表 グラフ", "導関数 増減表"]

// function convertAudioToBase64(file: any) {
//   try {
//     console.log("file", file.type);
//     return Buffer.from(file.arrayBuffer()).toString("base64");
//   } catch (error) {
//     console.log(error);
//   }
// }


// const checkIfBase64 = (str: string) => {
//   const base64Pattern = /^[a-zA-Z0-9+/]+={0,2}$/;
//   const base64Length = str.length % 4 === 0;
//   return base64Pattern.test(str) && base64Length;
// };

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
