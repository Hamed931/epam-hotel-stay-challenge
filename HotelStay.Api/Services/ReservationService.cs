using System.Collections.Concurrent;
using HotelStay.Api.Models;

namespace HotelStay.Api.Services;

public interface IReservationService
{
    Task<ReservationResponse> ReserveAsync(ReserveRoomRequest request);
    Task<ReservationResponse?> GetReservationAsync(string reference);
}

public sealed class DocumentValidationException : ArgumentException
{
    public DocumentValidationException(string message) : base(message)
    {
    }
}

public class ReservationService : IReservationService
{
    private readonly ConcurrentDictionary<string, ReservationResponse> _store = new();

    // Minimal deterministic city lists used for destination-type resolution
    private static readonly HashSet<string> DomesticCities = new(StringComparer.OrdinalIgnoreCase)
    {
        "New York",
        "Los Angeles"
    };

    private static readonly HashSet<string> InternationalCities = new(StringComparer.OrdinalIgnoreCase)
    {
        "London",
        "Paris",
        "Tokyo"
    };

    // Default per-night rates used when reservation price is not provided by a provider
    private readonly Dictionary<RoomType, decimal> _defaultRates = new()
    {
        [RoomType.Standard] = 100m,
        [RoomType.Deluxe] = 150m,
        [RoomType.Suite] = 220m
    };

    public Task<ReservationResponse> ReserveAsync(ReserveRoomRequest request)
    {
        ValidateRequest(request, out var destinationType);

        var nights = Math.Max(1, request.CheckOut.DayNumber - request.CheckIn.DayNumber);

        var perNight = _defaultRates.TryGetValue(request.RoomType, out var r) ? r : 0m;
        var totalPrice = perNight * nights;

        // Simple business rule for cancellation policy based on room type
        var cancellation = request.RoomType switch
        {
            RoomType.Standard => CancellationPolicy.Flexible24h,
            RoomType.Deluxe => CancellationPolicy.FreeCancellation48h,
            RoomType.Suite => CancellationPolicy.NonRefundable,
            _ => CancellationPolicy.NonRefundable
        };

        var reference = GenerateReference();

        var response = new ReservationResponse(
            reference,
            request.ProviderName,
            request.RoomType,
            request.Destination,
            totalPrice,
            cancellation,
            request.GuestName,
            request.CheckIn,
            request.CheckOut
        );

        _store[reference] = response;

        return Task.FromResult(response);
    }

    public Task<ReservationResponse?> GetReservationAsync(string reference)
    {
        _store.TryGetValue(reference, out var result);
        return Task.FromResult(result);
    }

    private static string GenerateReference()
        => $"RSV-{Guid.NewGuid().ToString("N").Substring(0, 8).ToUpperInvariant()}";

    private void ValidateRequest(ReserveRoomRequest request, out DestinationType destinationType)
    {
        var errors = new List<string>();
        var hasDocumentMismatch = false;

        if (string.IsNullOrWhiteSpace(request.ProviderName))
            errors.Add("ProviderName is required.");

        if (string.IsNullOrWhiteSpace(request.RoomId))
            errors.Add("RoomId is required.");

        if (string.IsNullOrWhiteSpace(request.Destination))
            errors.Add("Destination is required.");

        if (request.CheckOut <= request.CheckIn)
            errors.Add("CheckOut must be after CheckIn.");

        if (string.IsNullOrWhiteSpace(request.GuestName))
            errors.Add("GuestName is required.");

        if (string.IsNullOrWhiteSpace(request.DocumentNumber))
            errors.Add("DocumentNumber is required.");

        var dest = request.Destination?.Trim() ?? string.Empty;
        if (DomesticCities.Contains(dest)) destinationType = DestinationType.Domestic;
        else if (InternationalCities.Contains(dest)) destinationType = DestinationType.International;
        else destinationType = DestinationType.Domestic; // default to domestic when unknown

        if (destinationType == DestinationType.International && request.DocumentType != DocumentType.Passport)
        {
            errors.Add("International destinations require a Passport.");
            hasDocumentMismatch = true;
        }

        if (destinationType == DestinationType.Domestic && request.DocumentType != DocumentType.NationalId && request.DocumentType != DocumentType.Passport)
        {
            errors.Add("Domestic destinations require a NationalId or Passport.");
            hasDocumentMismatch = true;
        }

        if (errors.Count > 0)
        {
            if (hasDocumentMismatch)
                throw new DocumentValidationException(string.Join(" ", errors));

            throw new ArgumentException(string.Join(" ", errors));
        }
    }
}
