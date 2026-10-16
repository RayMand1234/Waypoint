// The sample trip used everywhere: Tel Aviv → Lisbon, 12–16 May, 2 adults.
// Hotel names and prices are placeholders.

export const LISBON = { lat: 38.7223, lng: -9.1393 } as const;

export const rawRatesResponse = {
  data: [
    {
      hotelId: 'lp-alfama',
      roomTypes: [
        {
          offerId: 'offer-alfama-dbl',
          offerRetailRate: { amount: 520.5, currency: 'EUR' },
          rates: [
            {
              name: 'Double room',
              boardName: 'Breakfast included',
              cancellationPolicies: { refundableTag: 'RFN' },
            },
          ],
        },
        {
          offerId: 'offer-alfama-suite',
          offerRetailRate: [{ amount: 900, currency: 'EUR' }],
          rates: [{ name: 'Suite', boardName: 'Room only' }],
        },
      ],
    },
    {
      hotelId: 'lp-baixa',
      roomTypes: [
        {
          offerId: 'offer-baixa-twin',
          offerRetailRate: { amount: 410, currency: 'EUR' },
          rates: [
            {
              name: 'Twin room',
              cancellationPolicies: { refundableTag: 'NRFN' },
            },
          ],
        },
      ],
    },
    // No hotel data for this one: it must be dropped, not shown nameless.
    {
      hotelId: 'lp-unknown',
      roomTypes: [
        {
          offerId: 'offer-x',
          offerRetailRate: { amount: 100, currency: 'EUR' },
        },
      ],
    },
  ],
  hotels: [
    {
      id: 'lp-alfama',
      name: 'Casa Alfama (sample)',
      address: 'Rua dos Remédios 1',
      city_name: 'Lisbon',
      country_code: 'pt',
      latitude: 38.7115,
      longitude: -9.1301,
      rating: 9.1,
      stars: 4,
      review_count: 812,
      main_photo: 'https://img.example/alfama.jpg',
    },
    {
      id: 'lp-baixa',
      name: 'Baixa Rooms (sample)',
      city_name: 'Lisbon',
      country_code: 'pt',
      latitude: 38.7108,
      longitude: -9.1366,
      rating: 7.4,
      stars: 3,
    },
  ],
};

export const rawFlightRatesResponse = {
  data: [
    {
      journeys: [
        {
          journeyKey: 'tlv-lis-direct',
          cheapestOffer: {
            offerId: 'fo-direct',
            expiration: '2026-05-01T10:00:00Z',
            pricing: { display: { total: 640.2, currency: 'EUR' } },
            terms: { refundable: false, changeable: true },
            baggage: { hasCarryOnBag: true, hasCheckedBag: false },
            fare: { seatsRemaining: 4 },
          },
          segments: [
            {
              direction: 'OUTBOUND',
              originCode: 'TLV',
              originName: 'Ben Gurion',
              destinationCode: 'LIS',
              destinationName: 'Humberto Delgado',
              departureTime: '2027-05-12T06:10:00',
              arrivalTime: '2027-05-12T10:05:00',
              carrier: {
                marketingCode: 'TP',
                marketingName: 'TAP Air Portugal',
              },
              flight: { marketingNumber: 'TP1386' },
              duration: { minutes: 355 },
            },
            {
              direction: 'INBOUND',
              originCode: 'LIS',
              destinationCode: 'TLV',
              departureTime: '2027-05-16T21:30:00+01:00',
              arrivalTime: '2027-05-17T04:05:00',
              carrier: { marketingCode: 'TP' },
              flight: { marketingNumber: 'TP1385' },
              duration: { minutes: 335 },
            },
          ],
          legDurations: [
            { direction: 'OUTBOUND', duration: { minutes: 355 } },
            { direction: 'INBOUND', duration: { minutes: 335 } },
          ],
        },
        {
          journeyKey: 'tlv-lis-via-mad',
          cheapestOffer: {
            offerId: 'fo-via',
            pricing: { display: { total: 455, currency: 'EUR' } },
          },
          segments: [
            {
              direction: 'OUTBOUND',
              originCode: 'TLV',
              destinationCode: 'MAD',
              departureTime: '2027-05-12T05:00:00',
              arrivalTime: '2027-05-12T09:30:00',
              carrier: { marketingCode: 'IB' },
              flight: { marketingNumber: 'IB3317' },
              duration: { minutes: 330 },
            },
            {
              direction: 'OUTBOUND',
              originCode: 'MAD',
              destinationCode: 'LIS',
              departureTime: '2027-05-12T12:00:00',
              arrivalTime: '2027-05-12T12:20:00',
              carrier: { marketingCode: 'IB' },
              flight: { marketingNumber: 'IB3106' },
              duration: { minutes: 80 },
            },
          ],
        },
        // Malformed: dropped on its own, the rest still come through.
        { journeyKey: 'broken' },
      ],
    },
  ],
};
