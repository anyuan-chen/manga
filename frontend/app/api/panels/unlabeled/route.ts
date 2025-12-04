import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Fetch panels that don't have position data saved
    const panels = await prisma.panel.findMany({
      where: {
        OR: [
          { pageNumber: null },
          { x: null },
          { y: null },
          { width: null },
          { height: null },
        ],
      },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            filePath: true,
          },
        },
      },
      orderBy: [
        { chapterId: 'asc' },
        { orderIndex: 'asc' },
      ],
    });

    return NextResponse.json({ panels });
  } catch (error) {
    console.error('Error fetching unlabeled panels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unlabeled panels' },
      { status: 500 }
    );
  }
}
