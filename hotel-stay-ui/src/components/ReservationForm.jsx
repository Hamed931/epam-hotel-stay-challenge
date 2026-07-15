import { DOCUMENT_TYPES } from "../models/hotelModels";

function ReservationForm({
  selectedRoom,
  destination,
  checkIn,
  checkOut,
  form,
  errors,
  isSubmitting,
  statusMessage,
  statusType,
  onChange,
  onSubmit,
}) {
  if (!selectedRoom) {
    return null;
  }

  return (
    <section className="reservation-shell" aria-live="polite">
      <div className="reservation-header">
        <h2>Reserve selected room</h2>
        <p>
          {selectedRoom.roomType} at {selectedRoom.providerName} in {destination} ({checkIn} to {checkOut})
        </p>
      </div>

      <form className="reservation-form" onSubmit={onSubmit} noValidate>
        <div className="form-grid">
          <label className="field">
            <span>Guest name</span>
            <input
              type="text"
              name="guestName"
              value={form.guestName}
              onChange={onChange}
              placeholder="e.g. John Carter"
              aria-invalid={Boolean(errors.guestName)}
              aria-describedby={errors.guestName ? "guestName-error" : undefined}
            />
            {errors.guestName ? (
              <small id="guestName-error" className="error-text">
                {errors.guestName}
              </small>
            ) : null}
          </label>

          <label className="field">
            <span>Document type</span>
            <select
              name="documentType"
              value={form.documentType}
              onChange={onChange}
              aria-invalid={Boolean(errors.documentType)}
              aria-describedby={errors.documentType ? "documentType-error" : undefined}
            >
              <option value="">Select document type</option>
              {DOCUMENT_TYPES.map((documentType) => (
                <option key={documentType} value={documentType}>
                  {documentType}
                </option>
              ))}
            </select>
            {errors.documentType ? (
              <small id="documentType-error" className="error-text">
                {errors.documentType}
              </small>
            ) : null}
          </label>

          <label className="field field-full">
            <span>Document number</span>
            <input
              type="text"
              name="documentNumber"
              value={form.documentNumber}
              onChange={onChange}
              placeholder="Enter document number"
              aria-invalid={Boolean(errors.documentNumber)}
              aria-describedby={errors.documentNumber ? "documentNumber-error" : undefined}
            />
            {errors.documentNumber ? (
              <small id="documentNumber-error" className="error-text">
                {errors.documentNumber}
              </small>
            ) : null}
          </label>
        </div>

        <button type="submit" className="reserve-button" disabled={isSubmitting}>
          {isSubmitting ? "Reserving..." : "Reserve room"}
        </button>
      </form>

      {statusMessage && statusType !== "success" ? (
        <p className={`reservation-status ${statusType}`}>{statusMessage}</p>
      ) : null}
    </section>
  );
}

export default ReservationForm;
