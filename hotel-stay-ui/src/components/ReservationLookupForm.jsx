function ReservationLookupForm({
  reference,
  onReferenceChange,
  onSubmit,
  isLoading,
  statusType,
  statusMessage,
}) {
  return (
    <section className="lookup-shell" aria-label="Lookup reservation">
      <div className="lookup-header">
        <h2>Find an existing reservation</h2>
        <p>Enter a reservation reference to load its details.</p>
      </div>

      <form className="lookup-form" onSubmit={onSubmit} noValidate>
        <label className="field" htmlFor="lookupReference">
          <span>Reservation reference</span>
          <input
            id="lookupReference"
            name="lookupReference"
            type="text"
            value={reference}
            onChange={onReferenceChange}
            placeholder="e.g. RSV-1A2B3C4D"
            autoComplete="off"
            spellCheck={false}
            disabled={isLoading}
          />
        </label>

        <button type="submit" className="lookup-button" disabled={isLoading}>
          {isLoading ? "Checking..." : "Lookup reservation"}
        </button>
      </form>

      {statusMessage ? (
        <p className={`lookup-status ${statusType}`}>{statusMessage}</p>
      ) : null}
    </section>
  );
}

export default ReservationLookupForm;
