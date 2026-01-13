import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET all trades for authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {
      userId: session.userId,
    };

    if (startDate && endDate) {
      whereClause.tradeDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: { tradeDate: 'desc' },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}

// POST - Create a new trade
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    // Validate required fields
    if (!symbol || !tradeType || !entryPrice || !quantity || !tradeDate) {
      return NextResponse.json(
        { error: 'Symbol, trade type, entry price, quantity, and trade date are required' },
        { status: 400 }
      );
    }

    // Calculate profit/loss if exit price is provided
    let profitLoss = null;
    if (exitPrice) {
      if (tradeType === 'BUY') {
        profitLoss = (exitPrice - entryPrice) * quantity;
      } else {
        profitLoss = (entryPrice - exitPrice) * quantity;
      }
    }

    const trade = await prisma.trade.create({
      data: {
        userId: session.userId,
        symbol: symbol.toUpperCase(),
        tradeType,
        instrumentType: instrumentType || 'STOCK',
        entryPrice: parseFloat(entryPrice),
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        quantity: parseFloat(quantity),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        profitLoss,
        status: status || (exitPrice ? 'CLOSED' : 'OPEN'),
        notes: notes || null,
        tradeDate: new Date(tradeDate),
      },
    });

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    console.error('Create trade error:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}
