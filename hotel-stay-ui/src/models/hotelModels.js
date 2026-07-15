export const ROOM_TYPES = ["Standard", "Deluxe", "Suite"];

export const SUPPORTED_DESTINATIONS = [
  "New York",
  "Los Angeles",
  "London",
  "Paris",
  "Tokyo",
];

export const DOCUMENT_TYPES = ["Passport", "NationalId"];

export const DOMESTIC_DESTINATIONS = ["New York", "Los Angeles"];

export const INTERNATIONAL_DESTINATIONS = ["London", "Paris", "Tokyo"];

export function createSearchRequestModel({
  destination,
  checkIn,
  checkOut,
  roomType,
}) {
  return {
    destination: destination?.trim() ?? "",
    checkIn: checkIn ?? "",
    checkOut: checkOut ?? "",
    roomType: roomType || null,
  };
}
