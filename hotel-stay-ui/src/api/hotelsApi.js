const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

function buildSearchQuery(params) {
  const query = new URLSearchParams();
  query.set("destination", params.destination);
  query.set("checkIn", params.checkIn);
  query.set("checkOut", params.checkOut);

  if (params.roomType) {
    query.set("roomType", params.roomType);
  }

  return query.toString();
}

export async function searchHotels(searchRequest, signal) {
  const qs = buildSearchQuery(searchRequest);
  const response = await fetch(`${apiBaseUrl}/hotels/search?${qs}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    let message = "Failed to search hotels.";

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json();
        message = typeof body === "string" ? body : body?.message ?? message;
      } else {
        const text = await response.text();
        if (text) message = text;
      }
    } catch {
      // Keep default message when response parsing fails.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function reserveRoom(reserveRequest, signal) {
  const response = await fetch(`${apiBaseUrl}/hotels/reserve`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reserveRequest),
    signal,
  });

  if (!response.ok) {
    let message = "Failed to reserve room.";

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json();
        message = typeof body === "string" ? body : body?.message ?? message;
      } else {
        const text = await response.text();
        if (text) message = text;
      }
    } catch {
      // Keep default message when response parsing fails.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function lookupReservation(reference, signal) {
  const encodedReference = encodeURIComponent(reference.trim());
  const response = await fetch(`${apiBaseUrl}/hotels/reservation/${encodedReference}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    let message = "Failed to lookup reservation.";

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = await response.json();
        message = typeof body === "string" ? body : body?.message ?? message;
      } else {
        const text = await response.text();
        if (text) message = text;
      }
    } catch {
      // Keep default message when response parsing fails.
    }

    throw new Error(message);
  }

  return response.json();
}
