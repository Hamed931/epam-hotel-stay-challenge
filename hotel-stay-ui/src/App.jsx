import { useMemo, useState } from "react";
import HotelSearchForm from "./components/HotelSearchForm";
import SearchResultsView, { getRoomKey } from "./components/SearchResultsView";
import ReservationForm from "./components/ReservationForm";
import ReservationLookupForm from "./components/ReservationLookupForm";
import ReservationConfirmationPanel from "./components/ReservationConfirmationPanel";
import { lookupReservation, reserveRoom, searchHotels } from "./api/hotelsApi";
import {
  createSearchRequestModel,
  DOMESTIC_DESTINATIONS,
  INTERNATIONAL_DESTINATIONS,
  SUPPORTED_DESTINATIONS,
} from "./models/hotelModels";
import "./App.css";

const initialForm = {
  destination: "",
  checkIn: "",
  checkOut: "",
  roomType: "",
};

const initialReservationForm = {
  guestName: "",
  documentType: "",
  documentNumber: "",
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedRoomKey, setSelectedRoomKey] = useState(null);
  const [reservationForm, setReservationForm] = useState(initialReservationForm);
  const [reservationErrors, setReservationErrors] = useState({});
  const [isReserving, setIsReserving] = useState(false);
  const [reservationStatus, setReservationStatus] = useState({
    type: "idle",
    message: "",
  });
  const [reservationConfirmation, setReservationConfirmation] = useState(null);
  const [lookupReference, setLookupReference] = useState("");
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupStatus, setLookupStatus] = useState({ type: "idle", message: "" });
  const [lookupConfirmation, setLookupConfirmation] = useState(null);

  const supportedDestinations = useMemo(
    () => new Set(SUPPORTED_DESTINATIONS.map((city) => city.toLowerCase())),
    [],
  );

  const domesticDestinations = useMemo(
    () => new Set(DOMESTIC_DESTINATIONS.map((city) => city.toLowerCase())),
    [],
  );

  const internationalDestinations = useMemo(
    () => new Set(INTERNATIONAL_DESTINATIONS.map((city) => city.toLowerCase())),
    [],
  );

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validateSearchForm(values) {
    const nextErrors = {};
    const destination = values.destination.trim();

    if (!destination) {
      nextErrors.destination = "Destination is required.";
    } else if (!supportedDestinations.has(destination.toLowerCase())) {
      nextErrors.destination = "Destination is not supported for this challenge.";
    }

    if (!values.checkIn) {
      nextErrors.checkIn = "Check-in date is required.";
    }

    if (!values.checkOut) {
      nextErrors.checkOut = "Check-out date is required.";
    }

    if (values.checkIn && values.checkOut && values.checkOut <= values.checkIn) {
      nextErrors.checkOut = "Check-out must be after check-in.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    const validationErrors = validateSearchForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({ type: "validation", message: "Please fix the highlighted fields." });
      return;
    }

    const model = createSearchRequestModel(form);

    setIsLoading(true);
    try {
      const data = await searchHotels(model);
      setSearchResults(data);
      setSelectedRoomKey(null);
      setReservationForm(initialReservationForm);
      setReservationErrors({});
      setReservationStatus({ type: "idle", message: "" });
      setReservationConfirmation(null);
      setStatus({
        type: "success",
        message: `Search completed. ${data.length} available room options were found.`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to search hotels right now.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const sortedResults = useMemo(() => {
    const clone = [...searchResults];
    clone.sort((a, b) =>
      sortOrder === "asc" ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice,
    );
    return clone;
  }, [searchResults, sortOrder]);

  const selectedRoom = useMemo(
    () => searchResults.find((room) => getRoomKey(room) === selectedRoomKey) ?? null,
    [searchResults, selectedRoomKey],
  );

  function handleSortChange(nextSortOrder) {
    setSortOrder(nextSortOrder);
  }

  function handleSelectRoom(roomKey) {
    setSelectedRoomKey(roomKey);
    setReservationForm(initialReservationForm);
    setReservationErrors({});
    setReservationStatus({ type: "idle", message: "" });
    setReservationConfirmation(null);
    const selectedRoom = searchResults.find((room) => getRoomKey(room) === roomKey);
    if (!selectedRoom) {
      return;
    }

    setStatus({
      type: "success",
      message: `${selectedRoom.roomType} at ${selectedRoom.providerName} selected. Reservation step is coming next.`,
    });
  }

  function handleReservationInputChange(event) {
    const { name, value } = event.target;
    setReservationForm((prev) => ({ ...prev, [name]: value }));
    setReservationErrors((prev) => ({ ...prev, [name]: undefined }));
    setReservationStatus({ type: "idle", message: "" });
  }

  function handleLookupReferenceChange(event) {
    setLookupReference(event.target.value);
    setLookupStatus({ type: "idle", message: "" });
    setLookupConfirmation(null);
  }

  function validateReservationForm(values) {
    const nextErrors = {};
    const destinationKey = form.destination.trim().toLowerCase();
    const isInternational = internationalDestinations.has(destinationKey);
    const isDomestic = domesticDestinations.has(destinationKey);

    if (!values.guestName.trim()) {
      nextErrors.guestName = "Guest name is required.";
    }

    if (!values.documentType) {
      nextErrors.documentType = "Document type is required.";
    }

    if (!values.documentNumber.trim()) {
      nextErrors.documentNumber = "Document number is required.";
    }

    if (values.documentType) {
      if (isInternational && values.documentType !== "Passport") {
        nextErrors.documentType = "International destinations require a Passport.";
      }

      if (
        isDomestic &&
        !["NationalId", "Passport"].includes(values.documentType)
      ) {
        nextErrors.documentType = "Domestic destinations allow NationalId or Passport.";
      }
    }

    return nextErrors;
  }

  async function handleReservationSubmit(event) {
    event.preventDefault();
    setReservationStatus({ type: "idle", message: "" });

    if (!selectedRoom) {
      return;
    }

    const validationErrors = validateReservationForm(reservationForm);
    setReservationErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setReservationStatus({
        type: "validation",
        message: "Please fix the highlighted reservation fields.",
      });
      return;
    }

    const reserveRequest = {
      providerName: selectedRoom.providerName,
      roomId: selectedRoomKey,
      destination: form.destination.trim(),
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      roomType: selectedRoom.roomType,
      guestName: reservationForm.guestName.trim(),
      documentType: reservationForm.documentType,
      documentNumber: reservationForm.documentNumber.trim(),
    };

    setIsReserving(true);
    try {
      const reservation = await reserveRoom(reserveRequest);
      setReservationStatus({
        type: "success",
        message: "",
      });
      setReservationConfirmation({
        reference: reservation.reference,
        providerName: reservation.providerName ?? selectedRoom.providerName,
        roomType: reservation.roomType ?? selectedRoom.roomType,
        destination: form.destination.trim(),
        guestName: reservation.guestName ?? reservationForm.guestName.trim(),
        totalPrice: reservation.totalPrice ?? selectedRoom.totalPrice,
        cancellationPolicy:
          reservation.cancellationPolicy ?? selectedRoom.cancellationPolicy,
      });
    } catch (error) {
      setReservationStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to complete reservation.",
      });
    } finally {
      setIsReserving(false);
    }
  }

  async function handleLookupSubmit(event) {
    event.preventDefault();

    const reference = lookupReference.trim();
    setLookupStatus({ type: "idle", message: "" });
    setLookupConfirmation(null);

    if (!reference) {
      setLookupStatus({ type: "validation", message: "Reservation reference is required." });
      return;
    }

    setIsLookupLoading(true);
    try {
      const reservation = await lookupReservation(reference);

      if (!reservation) {
        setLookupStatus({
          type: "not-found",
          message: "No reservation was found for that reference.",
        });
        return;
      }

      setLookupConfirmation({
        reference: reservation.reference,
        providerName: reservation.providerName,
        roomType: reservation.roomType,
        destination: reservation.destination,
        guestName: reservation.guestName,
        totalPrice: reservation.totalPrice,
        cancellationPolicy: reservation.cancellationPolicy,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
      });
      setLookupStatus({
        type: "success",
        message: "Reservation details loaded successfully.",
      });
    } catch (error) {
      setLookupStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to lookup reservation right now.",
      });
    } finally {
      setIsLookupLoading(false);
    }
  }

  return (
    <main className="search-page">
      <section className="search-shell">
        <header className="page-header">
          <p className="eyebrow">SkyRoute Hotel Stay</p>
          <h1>Search hotel availability</h1>
          <p className="subtitle">
            Enter your destination and travel dates to check room availability from our
            supported providers.
          </p>
        </header>

        <HotelSearchForm
          form={form}
          errors={errors}
          isLoading={isLoading}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />

        <section className="status-panel" aria-live="polite">
          {status.type === "idle" ? (
            <p>Fill in the form and submit a search.</p>
          ) : null}
          {status.type === "validation" ? (
            <p className="status validation">{status.message}</p>
          ) : null}
          {status.type === "error" ? <p className="status error">{status.message}</p> : null}
          {status.type === "success" ? (
            <p className="status success">{status.message}</p>
          ) : null}
        </section>

        <SearchResultsView
          rooms={sortedResults}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          selectedRoomKey={selectedRoomKey}
          onSelectRoom={handleSelectRoom}
        />

        <ReservationForm
          selectedRoom={selectedRoom}
          destination={form.destination.trim()}
          checkIn={form.checkIn}
          checkOut={form.checkOut}
          form={reservationForm}
          errors={reservationErrors}
          isSubmitting={isReserving}
          statusMessage={reservationStatus.message}
          statusType={reservationStatus.type}
          onChange={handleReservationInputChange}
          onSubmit={handleReservationSubmit}
        />

        <ReservationConfirmationPanel confirmation={reservationConfirmation} />

        <ReservationLookupForm
          reference={lookupReference}
          onReferenceChange={handleLookupReferenceChange}
          onSubmit={handleLookupSubmit}
          isLoading={isLookupLoading}
          statusType={lookupStatus.type}
          statusMessage={lookupStatus.message}
        />

        <ReservationConfirmationPanel
          confirmation={lookupConfirmation}
          title="Reservation details"
        />
      </section>
    </main>
  );
}

export default App;
