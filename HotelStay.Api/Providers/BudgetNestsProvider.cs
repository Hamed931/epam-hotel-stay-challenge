using HotelStay.Api.Models;

namespace HotelStay.Api.Providers;

public class BudgetNestsProvider : IHotelProvider
{
    public string ProviderName => "BudgetNests";

    // Stub data expressed as the raw snake_case JSON shapes BudgetNests returns.
    // JsonPropertyName attributes on BudgetNestsRoomResponse reflect the wire format.
    private static readonly BudgetNestsRoomResponse[] RawRooms =
    [
        new("Standard", 90m,  "Flexible24h",   true),
        new("Deluxe",   130m, "NonRefundable",  false),
        new("Suite",    200m, "Flexible24h",    true),
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

    // Normalization: map BudgetNests snake_case raw shape → unified domain model.
    private HotelRoomOption Normalize(BudgetNestsRoomResponse raw, int nights) =>
        new(
            ProviderName,
            Enum.Parse<RoomType>(raw.RoomType),
            raw.RatePerNight,
            raw.RatePerNight * nights,
            Enum.Parse<CancellationPolicy>(raw.CancellationPolicy),
            raw.Available,
            0,
            []
        );
}
