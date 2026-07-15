using HotelStay.Api.Models;

namespace HotelStay.Api.Providers;

public class PremierStaysProvider : IHotelProvider
{
    public string ProviderName => "PremierStays";

    // Stub data expressed as the raw PascalCase JSON shapes PremierStays returns.
    private static readonly PremierStaysRoomResponse[] RawRooms =
    [
        new("Standard", 120m, "FreeCancellation48h", true,  3, ["Wi-Fi", "Breakfast", "City view"]),
        new("Deluxe",   180m, "FreeCancellation48h", true,  4, ["Wi-Fi", "Breakfast", "City view", "Mini-bar"]),
        new("Suite",    260m, "NonRefundable",        true,  5, ["Wi-Fi", "Breakfast", "City view", "Mini-bar", "Lounge access"]),
    ];

    public Task<IReadOnlyCollection<HotelRoomOption>> SearchAvailabilityAsync(HotelSearchRequest request)
    {
        var nights = Math.Max(1, request.CheckOut.DayNumber - request.CheckIn.DayNumber);

        var results = RawRooms
            .Where(r => request.RoomType is null ||
                        Enum.Parse<RoomType>(r.RoomType) == request.RoomType.Value)
            .Select(r => Normalize(r, nights))
            .ToArray();

        return Task.FromResult<IReadOnlyCollection<HotelRoomOption>>(results);
    }

    // Normalization: map PremierStays PascalCase raw shape → unified domain model.
    private HotelRoomOption Normalize(PremierStaysRoomResponse raw, int nights) =>
        new(
            ProviderName,
            Enum.Parse<RoomType>(raw.RoomType),
            raw.RatePerNight,
            raw.RatePerNight * nights,
            Enum.Parse<CancellationPolicy>(raw.CancellationPolicy),
            raw.IsAvailable,
            raw.StarRating,
            raw.Amenities
        );
}
