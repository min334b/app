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

const prompt = `この音声ファイルは，院生委員会についての会議の音声です．
  この会議の内容を議事録として詳細に分かりやすくまとめてください．各人物の発言を全て含めてください．ただし，発言に関してはいいよどみなどの議題に関係ない部分は省略し，読みやすいようにまとめてください．
  発言者にはそれぞれの名前を任意に割り当て，誰が発言したかを明確にしてください．
  議事録には，議題ごとのまとめ，重要な決定事項，次回の会議で取り上げる予定の事項などを含めてください．音声から分からなかった情報は空欄とすること．
  議事録はmarkdown形式で出力してください．
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
    const audio = Buffer.from(await files[0].arrayBuffer()).toString('base64');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent([
      prompt,
      {
        inlineData:
            { data: audio, mimeType: "audio/mp3" }
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
