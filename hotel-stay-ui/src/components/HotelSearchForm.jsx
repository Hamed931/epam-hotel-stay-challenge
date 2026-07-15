import { ROOM_TYPES, SUPPORTED_DESTINATIONS } from "../models/hotelModels";

function HotelSearchForm({ form, errors, isLoading, onChange, onSubmit }) {
  return (
    <form className="search-form" onSubmit={onSubmit} noValidate>
      <div className="form-grid">
        <label className="field">
          <span>Destination</span>
          <input
            type="text"
            name="destination"
            value={form.destination}
            onChange={onChange}
            placeholder="e.g. London"
            list="supported-destinations"
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={errors.destination ? "destination-error" : undefined}
          />
          <datalist id="supported-destinations">
            {SUPPORTED_DESTINATIONS.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
          {errors.destination ? (
            <small id="destination-error" className="error-text">
              {errors.destination}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Check-in</span>
          <input
            type="date"
            name="checkIn"
            value={form.checkIn}
            onChange={onChange}
            aria-invalid={Boolean(errors.checkIn)}
            aria-describedby={errors.checkIn ? "checkin-error" : undefined}
          />
          {errors.checkIn ? (
            <small id="checkin-error" className="error-text">
              {errors.checkIn}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Check-out</span>
          <input
            type="date"
            name="checkOut"
            value={form.checkOut}
            onChange={onChange}
            aria-invalid={Boolean(errors.checkOut)}
            aria-describedby={errors.checkOut ? "checkout-error" : undefined}
          />
          {errors.checkOut ? (
            <small id="checkout-error" className="error-text">
              {errors.checkOut}
            </small>
          ) : null}
        </label>

        <label className="field">
          <span>Room type (optional)</span>
          <select name="roomType" value={form.roomType} onChange={onChange}>
            <option value="">Any</option>
            {ROOM_TYPES.map((roomType) => (
              <option key={roomType} value={roomType}>
                {roomType}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" className="search-button" disabled={isLoading}>
        {isLoading ? "Searching..." : "Search hotels"}
      </button>
    </form>
  );
}

export default HotelSearchForm;
