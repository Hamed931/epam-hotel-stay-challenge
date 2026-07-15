function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function ReservationConfirmationPanel({ confirmation, title = "Reservation confirmed" }) {
  if (!confirmation) {
    return null;
  }

  return (
    <section className="confirmation-shell" aria-live="polite">
      <h3>{title}</h3>
      <p className="confirmation-reference">
        Reference: <strong>{confirmation.reference}</strong>
      </p>

      <dl className="confirmation-meta">
        <div>
          <dt>Provider</dt>
          <dd>{confirmation.providerName}</dd>
        </div>
        <div>
          <dt>Room type</dt>
          <dd>{confirmation.roomType}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{confirmation.destination ?? "-"}</dd>
        </div>
        <div>
          <dt>Guest name</dt>
          <dd>{confirmation.guestName}</dd>
        </div>
        {confirmation.checkIn ? (
          <div>
            <dt>Check-in</dt>
            <dd>{formatDate(confirmation.checkIn)}</dd>
          </div>
        ) : null}
        {confirmation.checkOut ? (
          <div>
            <dt>Check-out</dt>
            <dd>{formatDate(confirmation.checkOut)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Total price</dt>
          <dd>{formatCurrency(confirmation.totalPrice)}</dd>
        </div>
        <div>
          <dt>Cancellation policy</dt>
          <dd>{confirmation.cancellationPolicy}</dd>
        </div>
      </dl>
    </section>
  );
}

export default ReservationConfirmationPanel;
