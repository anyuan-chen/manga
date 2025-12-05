import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        filePath: true,
        orderIndex: true,
      },
    });

    // Map to the expected format with path for backward compatibility
    const pdfs = chapters.map(chapter => ({
      id: chapter.id,
      name: chapter.title,
      description: chapter.description,
      path: chapter.filePath ? `/data/chapters/${chapter.filePath}` : null,
      orderIndex: chapter.orderIndex,
    }));

    return NextResponse.json({ pdfs });
  } catch (error) {
    console.error('Error fetching chapters from database:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
