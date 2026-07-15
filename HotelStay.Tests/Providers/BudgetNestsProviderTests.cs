using HotelStay.Api.Models;
using HotelStay.Api.Providers;

namespace HotelStay.Tests.Providers;

public class BudgetNestsProviderTests
{
    private static readonly DateOnly CheckIn = new(2026, 8, 1);
    private static readonly DateOnly CheckOut = new(2026, 8, 4); // 3 nights

    [Fact]
    public void ProviderName_IsBudgetNests()
    {
        var provider = new BudgetNestsProvider();

        Assert.Equal("BudgetNests", provider.ProviderName);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_ReturnsAllRoomTypes_WhenNoRoomTypeSpecified()
    {
        var provider = new BudgetNestsProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = await provider.SearchAvailabilityAsync(request);

        Assert.Equal(3, results.Count);
        Assert.Contains(results, r => r.RoomType == RoomType.Standard);
        Assert.Contains(results, r => r.RoomType == RoomType.Deluxe);
        Assert.Contains(results, r => r.RoomType == RoomType.Suite);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_AlternatesAvailability_ByRoomOrder()
    {
        // Deterministic rule in BudgetNestsProvider: index % 2 == 0 is available.
        // With the fixed ordering [Standard, Deluxe, Suite] => indices 0,1,2.
        var provider = new BudgetNestsProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut);

        var results = (await provider.SearchAvailabilityAsync(request)).ToArray();

        Assert.True(results.Single(r => r.RoomType == RoomType.Standard).Available);
        Assert.False(results.Single(r => r.RoomType == RoomType.Deluxe).Available);
        Assert.True(results.Single(r => r.RoomType == RoomType.Suite).Available);
    }

    [Theory]
    [InlineData(RoomType.Standard, 90, CancellationPolicy.Flexible24h)]
    [InlineData(RoomType.Deluxe, 130, CancellationPolicy.NonRefundable)]
    [InlineData(RoomType.Suite, 200, CancellationPolicy.Flexible24h)]
    public async Task SearchAvailabilityAsync_ReturnsCorrectRateAndPolicy(
        RoomType roomType, decimal expectedRate, CancellationPolicy expectedPolicy)
    {
        var provider = new BudgetNestsProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, roomType);

        var room = (await provider.SearchAvailabilityAsync(request)).Single();

        Assert.Equal(expectedRate, room.PerNightRate);
        Assert.Equal(expectedPolicy, room.CancellationPolicy);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_ReturnsMinimalDetails_NoStarRatingOrAmenities()
    {
        var provider = new BudgetNestsProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, RoomType.Standard);

        var room = (await provider.SearchAvailabilityAsync(request)).Single();

        Assert.Equal(0, room.StarRating);
        Assert.Empty(room.Amenities);
    }

    [Fact]
    public async Task SearchAvailabilityAsync_CalculatesTotalPriceBasedOnNights()
    {
        var provider = new BudgetNestsProvider();
        var request = new HotelSearchRequest("New York", CheckIn, CheckOut, RoomType.Standard);

        var room = (await provider.SearchAvailabilityAsync(request)).Single();

        // 3 nights * 90 per night
        Assert.Equal(270m, room.TotalPrice);
    }
}
