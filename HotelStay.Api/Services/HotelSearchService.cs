using HotelStay.Api.Models;

namespace HotelStay.Api.Services;

public class HotelSearchService
{
    private readonly IEnumerable<IHotelProvider> _hotelProviders;

    public HotelSearchService(IEnumerable<IHotelProvider> hotelProviders)
    {
        _hotelProviders = hotelProviders;
    }

    public async Task<IReadOnlyCollection<HotelRoomOption>> SearchAsync(HotelSearchRequest request)
    {
        var providerTasks = _hotelProviders
            .Select(provider => provider.SearchAvailabilityAsync(request))
            .ToArray();

        var providerResults = await Task.WhenAll(providerTasks);

        var nights = Math.Max(1, request.CheckOut.DayNumber - request.CheckIn.DayNumber);

        var combined = providerResults
            .SelectMany(result => result)
            .Where(room => room.Available)
            .Where(room => !request.RoomType.HasValue || room.RoomType == request.RoomType.Value)
            .Select(room => room with { TotalPrice = room.PerNightRate * nights })
            .OrderBy(room => room.TotalPrice)
            .ToArray();

        return combined;
    }
}
