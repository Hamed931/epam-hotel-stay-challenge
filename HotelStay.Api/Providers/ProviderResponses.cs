using System.Text.Json.Serialization;

namespace HotelStay.Api.Providers;

/// <summary>
/// Raw response shape as returned by PremierStays — PascalCase JSON properties.
/// </summary>
internal sealed record PremierStaysRoomResponse(
    string RoomType,
    decimal RatePerNight,
    string CancellationPolicy,
    bool IsAvailable,
    int StarRating,
    IReadOnlyList<string> Amenities
);

/// <summary>
/// Raw response shape as returned by BudgetNests — snake_case JSON properties.
/// </summary>
internal sealed record BudgetNestsRoomResponse(
    [property: JsonPropertyName("room_type")]          string RoomType,
    [property: JsonPropertyName("rate_per_night")]     decimal RatePerNight,
    [property: JsonPropertyName("cancellation_policy")] string CancellationPolicy,
    [property: JsonPropertyName("available")]          bool Available
);
