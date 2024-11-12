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

const prompt = `この音声ファイルは，画像ファイルの内容について理解しきれなかった生徒が，講師に質問に来た時の音声です．
  生徒個々人の問題点に特化して，内容の理解を促進するようなweb画像を検索するための検索ワードを出力してください．
  ただし，検索ワードは有効性が高いと思われるものから順番に5つ出力してください．
  具体例を示します．以下の検索ワードは，「3次関数の増減，極値を求め，グラフを描く問題」
  が理解できない生徒のためのweb画像を検索するための検索ワードの出力です．この形式に従って出力してください．

  3次関数 増減 グラフ,3次関数 極値 グラフ 描き方,導関数 極値,増減表 グラフ,導関数 増減表
  `
  // ["3次関数 増減 グラフ", "3次関数 極値 グラフ 描き方", "導関数 極値", "増減表 グラフ", "導関数 増減表"]


function convertAudioToBase64(file: any) {
  try {
    console.log("file", file.type);
    return Buffer.from(file.arrayBuffer()).toString("base64");
    // return {
    //   inlineData: {
    //     // data: Buffer.from(file).toString("base64"),
    //     data: Buffer.from(file.arrayBuffer()).toString("base64"),
    //     mimeType: "audio/wav",
    //   },
    // };
  } catch (error) {
    console.log(error);
  }
}
// async function generateTextFromAudio(audio: File, audioAll: File) {
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
//   const result = await model.generateContent([
//     "この音声の内容を要約してください．",
//     {
//       inlineData: 
//           { data: audio, mimeType: "audio/wav" }
//     },
//     {
//       inlineData: 
//           { data: audioAll, mimeType: "audio/wav" }
//     },
    
//   ]);
//   const response = await result.response;
//   const text = response.text();
//   return text;
// }


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

    // https://nextjs.org/docs/app/building-your-application/routing/route-handlers#request-body
    const formData = await req.formData()
    console.log("formData", formData)
    const files = formData.getAll("files") as File[];
    console.log("files", files[0])
    console.log("files", files[1].valueOf())
    // const audio = convertAudioToBase64(files[0]);
    // const audioAll = convertAudioToBase64(files[1]);
    const audio = Buffer.from(await files[0].arrayBuffer()).toString('base64');
    const image = Buffer.from(await files[1].arrayBuffer()).toString('base64');
    // const audioAll = Buffer.from(await files[1].arrayBuffer()).toString('base64');
    // console.log("audio", audio)
    // console.log("audio_result", checkIfBase64(audio))
    // console.log("audioAll", audioAll)
    // console.log("audioAll_result", checkIfBase64(audioAll))

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: 
            { data: audio, mimeType: "audio/wav" }
      },
      {
        inlineData: 
            { data: image, mimeType: "image/*" }
      },
    ]);
    const response = await result.response;

    // let text = await generateTextFromAudio(audio, audioAll);
    const text = response.text();
    console.log(text);

    return NextResponse.json({ message: 'Audio file uploaded successfully!', content: text });

    // base64
    // const form = new formidable.IncomingForm({
    //   uploadDir: path.join(process.cwd(), '/uploads'),
    //   keepExtensions: true,
    // });

    // form.parse(req, async (err, fields, files) => {
    //   if (err) {
    //     // res.status(500).json({ error: 'Failed to parse form' });
    //     return NextResponse.json({ message: 'Failed to parse form' }, { status: 500 });
    //     // return;
    //   }

    //   const audioWavPath = path.join(process.cwd(), '/audio.wav');
    //   const audioAllWavPath = path.join(process.cwd(), '/audio_all.wav');

    //   // アップロードされたファイルのパスを取得
    //   const uploadedFiles = Object.values(files).flat().map(file => {
    //     if (file && file.filepath) {
    //       return file.filepath;
    //     }
    //     return null;
    //   }).filter(Boolean);

    //   // Gemini1.5 Flashのプロンプト処理のためのダミー処理
    //   // 実際にはここでGemini1.5 Flash APIを呼び出す
      
    //   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    //   const prompt = "この音声の内容の理解を促進させるような画像を検索するための「検索ワード」を一つだけ出力してください．\nただし，「おにぎり 食べ方」のように，複数単語を含む検索ワードでも構いません．\n"

    //   const result = await model.generateContent([
    //     prompt, audioWavPath, audioAllWavPath
    //   ]);
    //   const response = result.response;
    //   // res.status(200).json({ output: response });
    //   const text = response.text();
    //   console.log(text);
    // });
    // return NextResponse.json({ message: 'Audio file uploaded successfully!', content: text });
    // return NextResponse.json({ message: 'test' });
  } catch (error) {
    console.error('Ocuring Error:', error);
    return NextResponse.json({ message: 'Failed.' }, { status: 500 });
    // res.status(405).json({ error: 'Method not allowed' });
  }
};
