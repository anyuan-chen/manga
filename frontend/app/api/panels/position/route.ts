import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { panelId, pageNumber, x, y, width, height } = body;

    if (!panelId || pageNumber === undefined || x === undefined || y === undefined || width === undefined || height === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: panelId, pageNumber, x, y, width, height' },
        { status: 400 }
      );
    }

    // Update the panel with position data
    const updatedPanel = await prisma.panel.update({
      where: { id: panelId },
      data: {
        pageNumber: Math.floor(pageNumber),
        x: Math.floor(x),
        y: Math.floor(y),
        width: Math.floor(width),
        height: Math.floor(height),
      },
    });

    return NextResponse.json({ panel: updatedPanel });
  } catch (error) {
    console.error('Error updating panel position:', error);
    return NextResponse.json(
      { error: 'Failed to update panel position' },
      { status: 500 }
    );
  }
}
