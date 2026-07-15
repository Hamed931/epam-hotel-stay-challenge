using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HotelStay.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;

namespace HotelStay.Tests.Api;

public class HotelsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public HotelsApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private static string SearchUrl(string? destination, string? checkIn, string? checkOut, RoomType? roomType = null)
    {
        var query = new List<string>();
        if (destination is not null) query.Add($"destination={Uri.EscapeDataString(destination)}");
        if (checkIn is not null) query.Add($"checkIn={checkIn}");
        if (checkOut is not null) query.Add($"checkOut={checkOut}");
        if (roomType is not null) query.Add($"roomType={roomType}");
        return "/hotels/search?" + string.Join('&', query);
    }

    private static Task<T?> ReadJsonAsync<T>(HttpContent content)
        => content.ReadFromJsonAsync<T>(JsonOptions);

    [Fact]
    public async Task Search_MissingDestination_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl(null, "2026-08-01", "2026-08-04"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_MissingCheckIn_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", null, "2026-08-04"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_MissingCheckOut_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", "2026-08-01", null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_CheckOutNotAfterCheckIn_Returns400()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", "2026-08-04", "2026-08-04"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Search_UnsupportedDestination_Returns400WithClearMessage()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("Mars City", "2026-08-01", "2026-08-04"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var message = await response.Content.ReadAsStringAsync();
        Assert.Contains("Unsupported destination", message);
    }

    [Fact]
    public async Task Search_ValidRequest_Returns200WithNormalizedAvailableRooms()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", "2026-08-01", "2026-08-04"));

        response.EnsureSuccessStatusCode();
        var rooms = await ReadJsonAsync<List<HotelRoomOption>>(response.Content);

        Assert.NotNull(rooms);
        Assert.NotEmpty(rooms!);
        // BudgetNests marks Deluxe unavailable deterministically; only available rooms should surface.
        Assert.All(rooms!, r => Assert.True(r.Available));
        Assert.Contains(rooms!, r => r.ProviderName == "PremierStays");
    }

    [Fact]
    public async Task Search_ValidRequest_SerializesEnumsAsStrings()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", "2026-08-01", "2026-08-04"));

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"roomType\":\"Standard\"", payload);
        Assert.Contains("\"cancellationPolicy\":\"", payload);
    }

    [Fact]
    public async Task Search_ValidRequest_ResultsAreSortedByTotalPriceAscending()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", "2026-08-01", "2026-08-04"));
        response.EnsureSuccessStatusCode();
        var rooms = await ReadJsonAsync<List<HotelRoomOption>>(response.Content);

        var prices = rooms!.Select(r => r.TotalPrice).ToArray();
        var sorted = prices.OrderBy(p => p).ToArray();
        Assert.Equal(sorted, prices);
    }

    [Fact]
    public async Task Search_WithRoomTypeFilter_ReturnsOnlyMatchingRoomType()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync(SearchUrl("New York", "2026-08-01", "2026-08-04", RoomType.Suite));
        response.EnsureSuccessStatusCode();
        var rooms = await ReadJsonAsync<List<HotelRoomOption>>(response.Content);

        Assert.All(rooms!, r => Assert.Equal(RoomType.Suite, r.RoomType));
    }

    [Fact]
    public async Task Reserve_ValidDomesticRequest_Returns201WithReference()
    {
        var client = _factory.CreateClient();
        var request = new ReserveRoomRequest(
            "PremierStays",
            "room-1",
            "New York",
            new DateOnly(2026, 8, 1),
            new DateOnly(2026, 8, 4),
            RoomType.Standard,
            "Jane Doe",
            DocumentType.NationalId,
            "AB123456");

        var response = await client.PostAsJsonAsync("/hotels/reserve", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var reservation = await ReadJsonAsync<ReservationResponse>(response.Content);
        Assert.NotNull(reservation);
        Assert.StartsWith("RSV-", reservation!.Reference);
    }

    [Fact]
    public async Task Reserve_InternationalDestinationWithoutPassport_Returns422()
    {
        var client = _factory.CreateClient();
        var request = new ReserveRoomRequest(
            "PremierStays",
            "room-1",
            "London",
            new DateOnly(2026, 8, 1),
            new DateOnly(2026, 8, 4),
            RoomType.Standard,
            "Jane Doe",
            DocumentType.NationalId,
            "AB123456");

        var response = await client.PostAsJsonAsync("/hotels/reserve", request);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task Reserve_MissingGuestName_Returns400()
    {
        var client = _factory.CreateClient();
        var request = new ReserveRoomRequest(
            "PremierStays",
            "room-1",
            "New York",
            new DateOnly(2026, 8, 1),
            new DateOnly(2026, 8, 4),
            RoomType.Standard,
            string.Empty,
            DocumentType.NationalId,
            "AB123456");

        var response = await client.PostAsJsonAsync("/hotels/reserve", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetReservation_UnknownReference_Returns404()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/hotels/reservation/RSV-UNKNOWN");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetReservation_KnownReference_Returns200WithReservationDetails()
    {
        var client = _factory.CreateClient();
        var reserveRequest = new ReserveRoomRequest(
            "PremierStays",
            "room-1",
            "New York",
            new DateOnly(2026, 8, 1),
            new DateOnly(2026, 8, 4),
            RoomType.Standard,
            "Jane Doe",
            DocumentType.NationalId,
            "AB123456");

        var reserveResponse = await client.PostAsJsonAsync("/hotels/reserve", reserveRequest);
        reserveResponse.EnsureSuccessStatusCode();
        var reservation = await ReadJsonAsync<ReservationResponse>(reserveResponse.Content);

        var lookupResponse = await client.GetAsync($"/hotels/reservation/{reservation!.Reference}");
        lookupResponse.EnsureSuccessStatusCode();
        var fetched = await ReadJsonAsync<ReservationResponse>(lookupResponse.Content);

        Assert.Equal(reservation.Reference, fetched!.Reference);
        Assert.Equal(reservation.GuestName, fetched.GuestName);
        Assert.Equal(reserveRequest.Destination, fetched.Destination);
    }
}
