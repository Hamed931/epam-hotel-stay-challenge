using HotelStay.Api.Models;
using HotelStay.Api.Services;

namespace HotelStay.Tests.Services;

public class ReservationServiceTests
{
    private static readonly DateOnly CheckIn = new(2026, 8, 1);
    private static readonly DateOnly CheckOut = new(2026, 8, 4); // 3 nights

    private static ReserveRoomRequest MakeRequest(
        string destination = "New York",
        RoomType roomType = RoomType.Standard,
        DocumentType documentType = DocumentType.NationalId,
        string guestName = "Jane Doe",
        string documentNumber = "AB123456",
        DateOnly? checkIn = null,
        DateOnly? checkOut = null,
        string providerName = "PremierStays",
        string roomId = "room-1")
        => new(
            providerName,
            roomId,
            destination,
            checkIn ?? CheckIn,
            checkOut ?? CheckOut,
            roomType,
            guestName,
            documentType,
            documentNumber);

    [Fact]
    public async Task ReserveAsync_Succeeds_ForDomesticDestinationWithNationalId()
    {
        var service = new ReservationService();
        var request = MakeRequest(destination: "New York", documentType: DocumentType.NationalId);

        var response = await service.ReserveAsync(request);

        Assert.Equal(request.GuestName, response.GuestName);
        Assert.Equal(request.ProviderName, response.ProviderName);
        Assert.Equal(request.RoomType, response.RoomType);
    }

    [Fact]
    public async Task ReserveAsync_Succeeds_ForInternationalDestinationWithPassport()
    {
        var service = new ReservationService();
        var request = MakeRequest(destination: "London", documentType: DocumentType.Passport);

        var response = await service.ReserveAsync(request);

        Assert.Equal(request.GuestName, response.GuestName);
    }

    [Fact]
    public async Task ReserveAsync_Throws_WhenInternationalDestinationUsesNationalId()
    {
        var service = new ReservationService();
        var request = MakeRequest(destination: "Paris", documentType: DocumentType.NationalId);

        var ex = await Assert.ThrowsAsync<DocumentValidationException>(() => service.ReserveAsync(request));
        Assert.Contains("Passport", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ReserveAsync_Throws_WhenGuestNameMissing(string guestName)
    {
        var service = new ReservationService();
        var request = MakeRequest(guestName: guestName);

        await Assert.ThrowsAsync<ArgumentException>(() => service.ReserveAsync(request));
    }

    [Fact]
    public async Task ReserveAsync_Throws_WhenDocumentNumberMissing()
    {
        var service = new ReservationService();
        var request = MakeRequest(documentNumber: "");

        await Assert.ThrowsAsync<ArgumentException>(() => service.ReserveAsync(request));
    }

    [Fact]
    public async Task ReserveAsync_Throws_WhenCheckOutNotAfterCheckIn()
    {
        var service = new ReservationService();
        var sameDay = new DateOnly(2026, 8, 1);
        var request = MakeRequest(checkIn: sameDay, checkOut: sameDay);

        await Assert.ThrowsAsync<ArgumentException>(() => service.ReserveAsync(request));
    }

    [Fact]
    public async Task ReserveAsync_GeneratesReferenceWithExpectedFormat()
    {
        var service = new ReservationService();
        var request = MakeRequest();

        var response = await service.ReserveAsync(request);

        Assert.StartsWith("RSV-", response.Reference);
        Assert.Equal("RSV-".Length + 8, response.Reference.Length);
    }

    [Fact]
    public async Task ReserveAsync_GeneratesUniqueReferences_AcrossMultipleCalls()
    {
        var service = new ReservationService();

        var first = await service.ReserveAsync(MakeRequest());
        var second = await service.ReserveAsync(MakeRequest());

        Assert.NotEqual(first.Reference, second.Reference);
    }

    [Theory]
    [InlineData(RoomType.Standard, 100, CancellationPolicy.Flexible24h)]
    [InlineData(RoomType.Deluxe, 150, CancellationPolicy.FreeCancellation48h)]
    [InlineData(RoomType.Suite, 220, CancellationPolicy.NonRefundable)]
    public async Task ReserveAsync_CalculatesTotalPriceAndCancellationPolicy_BasedOnRoomType(
        RoomType roomType, decimal expectedPerNightRate, CancellationPolicy expectedPolicy)
    {
        var service = new ReservationService();
        var request = MakeRequest(roomType: roomType);

        var response = await service.ReserveAsync(request);

        // 3 nights
        Assert.Equal(expectedPerNightRate * 3, response.TotalPrice);
        Assert.Equal(expectedPolicy, response.CancellationPolicy);
    }

    [Fact]
    public async Task GetReservationAsync_ReturnsNull_WhenReferenceUnknown()
    {
        var service = new ReservationService();

        var result = await service.GetReservationAsync("RSV-UNKNOWN");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetReservationAsync_ReturnsStoredReservation_AfterReserve()
    {
        var service = new ReservationService();
        var request = MakeRequest();

        var reserved = await service.ReserveAsync(request);
        var fetched = await service.GetReservationAsync(reserved.Reference);

        Assert.NotNull(fetched);
        Assert.Equal(reserved.Reference, fetched!.Reference);
        Assert.Equal(reserved.GuestName, fetched.GuestName);
        Assert.Equal(request.Destination, fetched.Destination);
    }
}
