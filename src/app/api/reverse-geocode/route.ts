import { NextResponse } from "next/server";
import { parseReverseGeocode } from "@/lib/geocode";

/**
 * Reverse-geocode a pinned coordinate into a human-readable area name.
 *
 * Proxied through the server rather than called from the browser so we can
 * send the User-Agent that OpenStreetMap's usage policy requires, and so no
 * third-party key is ever exposed to the client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng || Number.isNaN(+lat) || Number.isNaN(+lng)) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 },
    );
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
      `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
      `&zoom=16&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "BishalSalesCRM/1.0 (hospitality supplier CRM)",
        "Accept-Language": "en",
      },
      // Coordinates rarely change meaning; cache for a day.
      next: { revalidate: 86_400 },
    });

    if (!res.ok) throw new Error(`Geocoder responded ${res.status}`);

    const data = await res.json();
    return NextResponse.json(parseReverseGeocode(data));
  } catch {
    // Never block company creation on a geocoder outage.
    return NextResponse.json(
      { area: null, emirate: null, label: null, failed: true },
      { status: 200 },
    );
  }
}
