namespace HotelStay.Api.Models;

public enum RoomType
{
    Standard,
    Deluxe,
    Suite
}

public enum DocumentType
{
    Passport,
    NationalId
}

public enum CancellationPolicy
{
    FreeCancellation48h,
    Flexible24h,
    NonRefundable
}

public enum DestinationType
{
    Domestic,
    International
}

public sealed record HotelSearchRequest(
    string Destination,
    DateOnly CheckIn,
    DateOnly CheckOut,
    RoomType? RoomType = null
);

public sealed record HotelRoomOption(
    string ProviderName,
    RoomType RoomType,
    decimal PerNightRate,
    decimal TotalPrice,
    CancellationPolicy CancellationPolicy,
    bool Available,
    int StarRating,
    IReadOnlyList<string> Amenities
);

public sealed record ReserveRoomRequest(
    string ProviderName,
    string RoomId,
    string Destination,
    DateOnly CheckIn,
    DateOnly CheckOut,
    RoomType RoomType,
    string GuestName,
    DocumentType DocumentType,
    string DocumentNumber
);

public sealed record ReservationResponse(
    string Reference,
    string ProviderName,
    RoomType RoomType,
    string Destination,
    decimal TotalPrice,
    CancellationPolicy CancellationPolicy,
    string GuestName,
    DateOnly CheckIn,
    DateOnly CheckOut
);
