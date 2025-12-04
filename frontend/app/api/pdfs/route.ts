import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const chaptersDir = path.join(process.cwd(), 'public', 'data', 'chapters');

    // Check if directory exists
    if (!fs.existsSync(chaptersDir)) {
      return NextResponse.json({ pdfs: [] });
    }

    // Read all files in the directory
    const files = fs.readdirSync(chaptersDir);

    // Filter only PDF files
    const pdfFiles = files
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        name: file,
        path: `/data/chapters/${file}`,
      }));

    return NextResponse.json({ pdfs: pdfFiles });
  } catch (error) {
    console.error('Error reading PDF directory:', error);
    return NextResponse.json({ error: 'Failed to read PDFs' }, { status: 500 });
  }
}
