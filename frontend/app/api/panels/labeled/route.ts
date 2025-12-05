import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const chapterId = url.searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required' },
        { status: 400 }
      );
    }

    // Fetch panels that have valid position data and autoDisqualify is false
    const panels = await prisma.panel.findMany({
      where: {
        chapterId: chapterId,
        autoDisqualify: false,
        pageNumber: { not: null },
        x: { not: null },
        y: { not: null },
        width: { not: null },
        height: { not: null },
      },
      select: {
        id: true,
        orderIndex: true,
        pageNumber: true,
        x: true,
        y: true,
        width: true,
        height: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    return NextResponse.json({ panels });
  } catch (error) {
    console.error('Error fetching labeled panels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labeled panels' },
      { status: 500 }
    );
  }
}
