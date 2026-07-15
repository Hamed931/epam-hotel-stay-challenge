using HotelStay.Api.Models;
using HotelStay.Api.Services;
using HotelStay.Tests.TestDoubles;

namespace HotelStay.Tests.Services;

public class HotelSearchServiceTests
{
    private static readonly DateOnly CheckIn = new(2026, 8, 1);
    private static readonly DateOnly CheckOut = new(2026, 8, 4); // 3 nights

    private static HotelRoomOption MakeRoom(
        string provider,
        RoomType roomType,
        decimal perNightRate,
        bool available,
        CancellationPolicy policy = CancellationPolicy.Flexible24h)
        => new(provider, roomType, perNightRate, perNightRate, policy, available, 0, Array.Empty<string>());

    [Fact]
    public async Task SearchAsync_CombinesResultsFromAllProviders()
    {
        var providerA = new FakeHotelProvider("ProviderA", _ => new[]
        {
            MakeRoom("ProviderA", RoomType.Standard, 100m, true)
        });
        var providerB = new FakeHotelProvider("ProviderB", _ => new[]
        {
            MakeRoom("ProviderB", RoomType.Deluxe, 150m, true)
        });

        var service = new HotelSearchService(new[] { providerA, providerB });
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await service.SearchAsync(request);

        Assert.Equal(2, results.Count);
        Assert.Contains(results, r => r.ProviderName == "ProviderA");
        Assert.Contains(results, r => r.ProviderName == "ProviderB");
    }

    [Fact]
    public async Task SearchAsync_FiltersOutUnavailableRooms()
    {
        var provider = new FakeHotelProvider("Provider", _ => new[]
        {
            MakeRoom("Provider", RoomType.Standard, 100m, true),
            MakeRoom("Provider", RoomType.Deluxe, 150m, false)
        });

        var service = new HotelSearchService(new[] { provider });
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await service.SearchAsync(request);

        var room = Assert.Single(results);
        Assert.Equal(RoomType.Standard, room.RoomType);
    }

    [Fact]
    public async Task SearchAsync_FiltersByRoomType_WhenSpecified()
    {
        var provider = new FakeHotelProvider("Provider", _ => new[]
        {
            MakeRoom("Provider", RoomType.Standard, 100m, true),
            MakeRoom("Provider", RoomType.Suite, 250m, true)
        });

        var service = new HotelSearchService(new[] { provider });
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, RoomType.Suite);

        var results = await service.SearchAsync(request);

        var room = Assert.Single(results);
        Assert.Equal(RoomType.Suite, room.RoomType);
    }

    [Fact]
    public async Task SearchAsync_OrdersResultsByTotalPriceAscending()
    {
        var provider = new FakeHotelProvider("Provider", _ => new[]
        {
            MakeRoom("Provider", RoomType.Suite, 250m, true),
            MakeRoom("Provider", RoomType.Standard, 100m, true),
            MakeRoom("Provider", RoomType.Deluxe, 150m, true)
        });

        var service = new HotelSearchService(new[] { provider });
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await service.SearchAsync(request);

        Assert.Equal(
            new[] { RoomType.Standard, RoomType.Deluxe, RoomType.Suite },
            results.Select(r => r.RoomType));
    }

    [Fact]
    public async Task SearchAsync_RecalculatesTotalPrice_BasedOnNightsRegardlessOfProviderInput()
    {
        // Provider stub returns a mismatched TotalPrice on purpose; service must recompute it.
        var provider = new FakeHotelProvider("Provider", _ => new[]
        {
            new HotelRoomOption("Provider", RoomType.Standard, 100m, 999m, CancellationPolicy.Flexible24h, true, 0, Array.Empty<string>())
        });

        var service = new HotelSearchService(new[] { provider });
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var room = (await service.SearchAsync(request)).Single();

        // 3 nights * 100 per night
        Assert.Equal(300m, room.TotalPrice);
    }

    [Fact]
    public async Task SearchAsync_WithNoProviders_ReturnsEmptyCollection()
    {
        var service = new HotelSearchService(Array.Empty<IHotelProvider>());
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await service.SearchAsync(request);

        Assert.Empty(results);
    }
}
