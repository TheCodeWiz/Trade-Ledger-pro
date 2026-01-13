import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET single trade
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const trade = await prisma.trade.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ trade });
  } catch (error) {
    console.error('Get trade error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade' },
      { status: 500 }
    );
  }
}

// PUT - Update trade
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      symbol,
      tradeType,
      instrumentType,
      entryPrice,
      exitPrice,
      quantity,
      stopLoss,
      takeProfit,
      notes,
      tradeDate,
      status,
    } = body;

    // Calculate profit/loss if exit price is provided
    let profitLoss = existingTrade.profitLoss;
    const finalEntryPrice = entryPrice !== undefined ? parseFloat(entryPrice) : existingTrade.entryPrice;
    const finalExitPrice = exitPrice !== undefined ? parseFloat(exitPrice) : existingTrade.exitPrice;
    const finalQuantity = quantity !== undefined ? parseFloat(quantity) : existingTrade.quantity;
    const finalTradeType = tradeType || existingTrade.tradeType;

    if (finalExitPrice) {
      if (finalTradeType === 'BUY') {
        profitLoss = (finalExitPrice - finalEntryPrice) * finalQuantity;
      } else {
        profitLoss = (finalEntryPrice - finalExitPrice) * finalQuantity;
      }
    }

    const trade = await prisma.trade.update({
      where: { id },
      data: {
        symbol: symbol ? symbol.toUpperCase() : existingTrade.symbol,
        tradeType: finalTradeType,
        instrumentType: instrumentType || existingTrade.instrumentType,
        entryPrice: finalEntryPrice,
        exitPrice: finalExitPrice,
        quantity: finalQuantity,
        stopLoss: stopLoss !== undefined ? (stopLoss ? parseFloat(stopLoss) : null) : existingTrade.stopLoss,
        takeProfit: takeProfit !== undefined ? (takeProfit ? parseFloat(takeProfit) : null) : existingTrade.takeProfit,
        profitLoss,
        status: status || (finalExitPrice ? 'CLOSED' : existingTrade.status),
        notes: notes !== undefined ? notes : existingTrade.notes,
        tradeDate: tradeDate ? new Date(tradeDate) : existingTrade.tradeDate,
      },
    });

    return NextResponse.json({ trade });
  } catch (error) {
    console.error('Update trade error:', error);
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}

// DELETE trade
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    await prisma.trade.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    return NextResponse.json(
      { error: 'Failed to delete trade' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle star or partial update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if trade exists and belongs to user
    const existingTrade = await prisma.trade.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, isStarred } = body;

    // Handle star toggle
    if (action === 'toggleStar' || isStarred !== undefined) {
      const trade = await prisma.trade.update({
        where: { id },
        data: {
          isStarred: isStarred !== undefined ? isStarred : !existingTrade.isStarred,
        },
      });
      return NextResponse.json({ trade });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Patch trade error:', error);
    return NextResponse.json(
      { error: 'Failed to update trade' },
      { status: 500 }
    );
  }
}
