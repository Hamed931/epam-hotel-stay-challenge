using System.Text.Json.Serialization;
using HotelStay.Api.Models;
using HotelStay.Api.Providers;
using HotelStay.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddSingleton<IHotelProvider, PremierStaysProvider>();
builder.Services.AddSingleton<IHotelProvider, BudgetNestsProvider>();
builder.Services.AddSingleton<HotelSearchService>();
builder.Services.AddSingleton<IReservationService, ReservationService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var supportedDestinations = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "New York",
    "Los Angeles",
    "London",
    "Paris",
    "Tokyo"
};

app.MapGet("/hotels/search", async (
    HotelSearchService searchService,
    string? destination,
    DateOnly? checkIn,
    DateOnly? checkOut,
    RoomType? roomType) =>
{
    if (string.IsNullOrWhiteSpace(destination) || !checkIn.HasValue || !checkOut.HasValue)
    {
        return Results.BadRequest("destination, checkIn, and checkOut are required.");
    }

    if (checkOut.Value <= checkIn.Value)
    {
        return Results.BadRequest("checkOut must be after checkIn.");
    }

    var normalizedDestination = destination.Trim();
    if (!supportedDestinations.Contains(normalizedDestination))
    {
        return Results.BadRequest(
            "Unsupported destination. Supported destinations: New York, Los Angeles, London, Paris, Tokyo.");
    }

    var request = new HotelSearchRequest(
        normalizedDestination,
        checkIn.Value,
        checkOut.Value,
        roomType);

    var results = await searchService.SearchAsync(request);

    return Results.Ok(results);
})
.WithName("SearchHotels")
.WithOpenApi();

app.MapPost("/hotels/reserve", async (
    IReservationService reservationService,
    ReserveRoomRequest request) =>
{
    try
    {
        var response = await reservationService.ReserveAsync(request);
        return Results.Created($"/hotels/reservation/{response.Reference}", response);
    }
    catch (DocumentValidationException ex)
    {
        return Results.UnprocessableEntity(ex.Message);
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(ex.Message);
    }
})
.WithName("ReserveHotelRoom")
.WithOpenApi();

app.MapGet("/hotels/reservation/{reference}", async (
    IReservationService reservationService,
    string reference) =>
{
    var reservation = await reservationService.GetReservationAsync(reference);
    return reservation is not null ? Results.Ok(reservation) : Results.NotFound();
})
.WithName("GetReservation")
.WithOpenApi();

app.Run();

// Exposes the implicit Program class for WebApplicationFactory-based integration tests.
public partial class Program { }
