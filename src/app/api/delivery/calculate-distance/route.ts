import { NextResponse } from 'next/server';
import { calculateDeliveryDistance } from '@/lib/distance';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { addressLine1, addressLine2, city, state, postalCode } = body;

    const result = await calculateDeliveryDistance({
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
    });

    return NextResponse.json({
      success: true,
      distanceKm: result.distanceKm,
      durationText: result.durationText,
      codCharge: result.codCharge,
      storeAddress: result.storeAddress,
      destinationFormatted: result.destinationFormatted,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Error calculating delivery distance:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to calculate delivery distance',
      },
      { status: 500 }
    );
  }
}
