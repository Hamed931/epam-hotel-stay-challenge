namespace HotelStay.Api.Models;

public interface IHotelProvider
{
    Task<IReadOnlyCollection<HotelRoomOption>> SearchAvailabilityAsync(HotelSearchRequest request);
    string ProviderName { get; }
}
