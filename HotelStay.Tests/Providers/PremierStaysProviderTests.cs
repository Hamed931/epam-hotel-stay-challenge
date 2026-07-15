using HotelStay.Api.Models;
using HotelStay.Api.Providers;

namespace HotelStay.Tests.Providers;

public class PremierStaysProviderTests
{
    private static readonly DateOnly CheckIn = new(2026, 8, 1);
    private static readonly DateOnly CheckOut = new(2026, 8, 4); // 3 nights

    [Fact]
    public void ProviderName_IsPremierStays()
    {
        var provider = new PremierStaysProvider();

        Assert.Equal("PremierStays", provider.ProviderName);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_ReturnsAllRoomTypes_WhenNoRoomTypeSpecified()
    {
        var provider = new PremierStaysProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await provider.SearchAvailabilityAsync(request);

        Assert.Equal(3, results.Count);
        Assert.Contains(results, r => r.RoomType == RoomType.Standard);
        Assert.Contains(results, r => r.RoomType == RoomType.Deluxe);
        Assert.Contains(results, r => r.RoomType == RoomType.Suite);
    }

    [Theory]
    [InlineData(RoomType.Standard)]
    [InlineData(RoomType.Deluxe)]
    [InlineData(RoomType.Suite)]
    public async Task SearchAvailabilityAsync_FiltersByRoomType_WhenSpecified(RoomType roomType)
    {
        var provider = new PremierStaysProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, roomType);

        var results = await provider.SearchAvailabilityAsync(request);

        var room = Assert.Single(results);
        Assert.Equal(roomType, room.RoomType);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_AllRoomsAreAlwaysAvailable()
    {
        var provider = new PremierStaysProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await provider.SearchAvailabilityAsync(request);

        Assert.All(results, r => Assert.True(r.Available));
    }

    [Theory]
    [InlineData(RoomType.Standard, 120, CancellationPolicy.FreeCancellation48h, 3)]
    [InlineData(RoomType.Deluxe, 180, CancellationPolicy.FreeCancellation48h, 4)]
    [InlineData(RoomType.Suite, 260, CancellationPolicy.NonRefundable, 5)]
    public async Task SearchAvailabilityAsync_ReturnsCorrectRatePolicyAndStarRating(
        RoomType roomType, decimal expectedRate, CancellationPolicy expectedPolicy, int expectedStars)
    {
        var provider = new PremierStaysProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, roomType);

        var room = (await provider.SearchAvailabilityAsync(request)).Single();

        Assert.Equal(expectedRate, room.PerNightRate);
        Assert.Equal(expectedPolicy, room.CancellationPolicy);
        Assert.Equal(expectedStars, room.StarRating);
        Assert.NotEmpty(room.Amenities);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_CalculatesTotalPriceBasedOnNights()
    {
        var provider = new PremierStaysProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, RoomType.Standard);

        var room = (await provider.SearchAvailabilityAsync(request)).Single();

        // 3 nights * 120 per night
        Assert.Equal(360m, room.TotalPrice);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_UsesMinimumOfOneNight_WhenCheckInEqualsCheckOut()
    {
        var provider = new PremierStaysProvider();
        var sameDay = new DateOnly(2026, 8, 1);
        var request = new HotelSearchRequest("New York", sameDay, sameDay, RoomType.Standard);

        var room = (await provider.SearchAvailabilityAsync(request)).Single();

        Assert.Equal(120m, room.TotalPrice);
    }
}
