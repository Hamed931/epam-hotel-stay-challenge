using HotelStay.Api.Models;

namespace HotelStay.Tests.TestDoubles;

/// <summary>
/// Deterministic test double for <see cref="IHotelProvider"/> that returns a
/// caller-supplied set of rooms without any provider-specific business logic.
/// </summary>
public sealed class FakeHotelProvider : IHotelProvider
{
    private readonly Func<HotelSearchRequest, IReadOnlyCollection<HotelRoomOption>> _resultFactory;

    public FakeHotelProvider(string providerName, Func<HotelSearchRequest, IReadOnlyCollection<HotelRoomOption>> resultFactory)
    {
        ProviderName = providerName;
        _resultFactory = resultFactory;
    }

    public string ProviderName { get; }

    public Task<IReadOnlyCollection<HotelRoomOption>> SearchAvailabilityAsync(HotelSearchRequest request)
        => Task.FromResult(_resultFactory(request));
}
