// import { NextApiRequest, NextApiResponse } from 'next';
// import { NextRequest, NextResponse } from 'next/server';
// // import { ChatOllama } from "@langchain/community/chat_models/ollama";
// // // Ollamaを使って，Llama3を呼び出すPOSTリクエストを作成
// // import { Llama3 } from '@llama3/core';
// // import { Llama3Request } from '@llama3/core/dist/types';
// // import { Llama3Response } from '@llama3/core/dist/types';
// // import { Llama3Error } from '@llama3/core/dist/types';
// // import { Llama3ErrorType } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetail } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailType } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailValue } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailValueType } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailValueDetail } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailValueDetailType } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailValueDetailValue } from '@llama3/core/dist/types';
// // import { Llama3ErrorDetailValueDetailValueType } from '@llama3/core/dist/types';

// // // Ollamaを使って，Llama3を呼び出すPOSTリクエストを作成
// // export const POST = async (req: NextRequest) => {
// //     // Llama3のリクエストを作成
// //     const llama3Request: Llama3Request = {
// //         // リクエストID
// //         requestId: 'requestId',
// //         // リクエストの種類
// //         requestType: 'requestType',
// //         // リクエストのデータ
// //         requestData: {
// //             // リクエストデータのキー
// //             key: 'value',
// //         },
// //     };

// //     // Llama3のリクエストを送信
// //     const llama3Response: Llama3Response = await Llama3.sendRequest(llama3Request);

// //     // Llama3のレスポンスを返す
// //     return NextResponse.json(llama3Response);
// // }

// import { exec } from 'child_process';
// import util from 'util';

// const execPromise = util.promisify(exec);

// export const POST = async (req: NextRequest) => {
//   try {
//     // クライアントからpromptを受け取る
//     const { prompt } = await req.json();
//     if (!prompt) {
//       return NextResponse.json({ message: 'Prompt is required.' }, { status: 400 });
//     }

//     // ollama CLIを使ってLlama3を呼び出す
//     const command = `ollama run llama3 --prompt "${prompt}"`;
//     const { stdout, stderr } = await execPromise(command);

//     if (stderr) {
//       console.error('Error in Ollama CLI:', stderr);
//       return NextResponse.json({ message: 'Failed to generate response.', error: stderr }, { status: 500 });
//     }

//     // 出力結果をJSONレスポンスで返す
//     return NextResponse.json({ message: 'Llama3 response generated successfully!', content: stdout.trim() });
//   } catch (error) {
//     console.error('Error occurred:', error);
//     return NextResponse.json({ message: 'Failed to process the request.', error: (error as Error).message }, { status: 500 });
//   }
// };

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { spawn } from 'child_process';
// import vosk from 'vosk';
var vosk = require('..');

const MODEL_PATH = "model";
const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4000;

if (!fs.existsSync(MODEL_PATH)) {
    console.log("Please download the model from https://alphacephei.com/vosk/models and unpack as " + MODEL_PATH + " in the current folder.");
    process.exit();
}

const model = new vosk.Model(MODEL_PATH);

export const POST = async (req: NextRequest) => {
  try {
    // リクエストボディから音声データ（Base64エンコード）を受け取る
    const { audioData } = await req.json();

    // Base64データをバッファに変換
    const audioBuffer = Buffer.from(audioData, 'base64');

    // 一時ファイルに音声データを書き込む
    const tempFilePath = '/tmp/temp_audio.wav';
    fs.writeFileSync(tempFilePath, new Uint8Array(audioBuffer));

    const rec = new vosk.Recognizer({ model: model, sampleRate: SAMPLE_RATE });
    const ffmpeg_run = spawn('ffmpeg', ['-loglevel', 'quiet', '-i', tempFilePath,
                            '-ar', String(SAMPLE_RATE), '-ac', '1',
                            '-f', 's16le', '-bufsize', String(BUFFER_SIZE), '-']);

    let resultText = '';

    return new Promise((resolve, reject) => {
      ffmpeg_run.stdout.on('data', (stdout) => {
        if (rec.acceptWaveform(stdout)) {
          resultText += rec.result().text;
        } else {
          resultText += rec.partialResult().partial;
        }
      });

      ffmpeg_run.on('close', () => {
        resultText += rec.finalResult().text;
        rec.free();  // メモリを解放
        fs.unlinkSync(tempFilePath);  // 一時ファイルを削除
        resolve(NextResponse.json({ message: 'Audio file processed successfully!', content: resultText }));
      });

      ffmpeg_run.on('error', (error) => {
        console.error('Error during audio processing:', error);
        rec.free();
        fs.unlinkSync(tempFilePath);
        reject(NextResponse.json({ message: 'Failed to process audio file.' }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'Failed to process request.' }, { status: 500 });
  }
};

// export const POST = async (req: NextRequest) => {
//   try {
//     // リクエストボディから音声データを取得
//     const { audioData } = await req.json();

//     // ステップ1: Voskを使用して音声データをテキストに変換
//     // Voskとのやり取りを行う関数`convertAudioToText`が存在する前提
//     const transcription = await convertAudioToText(audioData);
//     if (!transcription) {
//       throw new Error("Voskによるテキスト変換に失敗しました");
//     }

//     // ステップ2: 変換したテキストをLlama3に送信
//     // Llama3とのやり取りを行う関数`queryLlama3`が存在する前提
//     const llamaResponse = await queryLlama3(transcription);
//     if (!llamaResponse) {
//       throw new Error("Llama3の応答取得に失敗しました");
//     }

//     // ステップ3: Llama3の応答を返す
//     return NextResponse.json({
//       message: '音声が正常に処理されました！',
//       content: llamaResponse,
//     });
//   } catch (error) {
//     console.error('エラー:', error);
//     return NextResponse.json({ message: '処理に失敗しました。' }, { status: 500 });
//   }
// };

// // Voskを使用して音声データをテキストに変換するユーティリティ関数
// async function convertAudioToText(audioData: string) {
//     // Vosk ASRが音声データを処理し、テキストを返す前提
//     // 必要に応じてbase64からバイナリデータに変換し、Voskを使用して変換を実施
//     const audioBuffer = Buffer.from(audioData, 'base64');

//     // Voskでの処理ロジックをここに記述
//     const result = await voskTranscribe(audioBuffer);
//     return result?.text || null;
// }

// // Llama3とのやり取りを行うユーティリティ関数
// async function queryLlama3(prompt: string) {
//   // Llama3にプロンプトを送信し、応答を受け取る例
//   const llama3Model = llamaAI.getGenerativeModel({ model: "llama-3" });
//   const result = await llama3Model.generateContent([
//     prompt,
//   ]);

//   return result?.response?.text() || null;
// }
