// import { NextRequest, NextResponse } from 'next/server';
// import { spawn } from 'child_process';
// import path from 'path';

// export const POST = async (req: NextRequest) => {
//   try {
//     // リクエストボディをパース
//     const { audioData } = await req.json();
//     console.log(audioData);

//     if (!audioData) {
//       return NextResponse.json({ message: 'Invalid input data' }, { status: 400 });
//     }

//     // // オーディオデータを一時ファイルとして保存
//     // const audioFilePath = path.join('/tmp', `audio_${Date.now()}.wav`);
//     // const fs = require('fs');
//     // fs.writeFileSync(audioFilePath, Buffer.from(audioData, 'base64'));

//     // Pythonスクリプトのパスを指定
//     const scriptPath = path.join(process.cwd(), 'whisper_transcribe.py');

//     // Pythonスクリプトを実行
//     const pythonProcess = spawn('python3', [scriptPath, audioData]);

//     let transcription = '';
//     let errorOutput = '';

//     // スクリプトの標準出力をキャプチャ
//     pythonProcess.stdout.on('data', (data) => {
//       transcription += data.toString();
//     });

//     // スクリプトのエラー出力をキャプチャ
//     pythonProcess.stderr.on('data', (data) => {
//       errorOutput += data.toString();
//     });

//     // スクリプトが終了したときの処理
//     const exitCode = await new Promise((resolve) => {
//       pythonProcess.on('close', resolve);
//     });

//     // エラーチェック
//     if (exitCode !== 0) {
//       console.error('Python Script Error:', errorOutput);
//       return NextResponse.json({ message: 'Failed to transcribe audio' }, { status: 500 });
//     }

//     // 成功した場合のレスポンス
//     return NextResponse.json({
//       message: 'Audio file transcribed successfully!',
//       content: transcription.trim(),
//     });
//   } catch (error) {
//     console.error('Error occurred:', error);
//     return NextResponse.json({ message: 'Failed to process request' }, { status: 500 });
//   }
// };

import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export const POST = async (req: Request) => {
  try {
    // リクエストからファイルデータを取得
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // 一時保存用のパス
    const tempFilePath = join(tmpdir(), file.name);

    // ファイルデータを一時保存
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, new Uint8Array(buffer));

    // Whisperスクリプトに渡して処理
    const scriptPath = join(process.cwd(), 'whisper_transcribe.py');
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python3', [scriptPath, tempFilePath]);

    let transcription = '';
    pythonProcess.stdout.on('data', (data: any) => {
      transcription += data.toString();
    });

    let errorOutput = '';
    pythonProcess.stderr.on('data', (data: any) => {
      errorOutput += data.toString();
    });

    const exitCode = await new Promise((resolve) => pythonProcess.on('close', resolve));

    if (exitCode !== 0) {
      console.error('Python Script Error:', errorOutput);
      return NextResponse.json({ message: 'Failed to transcribe audio' }, { status: 500 });
    }

    // 結果をレスポンスとして返す
    return NextResponse.json({ content: transcription.trim() });
  } catch (error) {
    console.error('Error occurred:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
};
