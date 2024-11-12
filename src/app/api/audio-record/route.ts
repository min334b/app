import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const POST = async (req: NextRequest) => {
  // https://zenn.dev/kiriyama/articles/87b8911973444d
  try {
    const { audioData, type } = await req.json();
    const basePath = path.resolve('./public');
    const audioFileName = type === 'latest' ? 'audio.wav' : 'audio_all.wav';
    const filePath = path.join(basePath, audioFileName);

    const buffer = Buffer.from(audioData.split(',')[1], 'base64');
    fs.writeFileSync(filePath, buffer);

    // res.status(200).json({ message: 'Audio saved successfully' });
    return NextResponse.json({ message: 'Audio saved successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error uploading audio file:', error);

    // 2xx → Success
    // 3xx → Redirection
    // 4xx → Client errors
    // 5xx → Server errors
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    // res.status(405).json({ message: 'Method not allowed' });
  }
};
