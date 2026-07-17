function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getRoomKey(room) {
  return `${room.providerName}-${room.roomType}-${room.perNightRate}-${room.totalPrice}`;
}

function SearchResultsView({
  rooms,
  sortOrder,
  onSortChange,
  selectedRoomKey,
  onSelectRoom,
}) {
  if (!rooms || rooms.length === 0) {
    return (
      <section className="results-shell" aria-live="polite">
        <div className="results-header">
          <h2>Available rooms</h2>
        </div>
        <p className="empty-results">No rooms found for this search.</p>
      </section>
    );
  }

  return (
    <section className="results-shell" aria-live="polite">
      <div className="results-header">
        <h2>Available rooms ({rooms.length})</h2>
        <label className="sort-control">
          <span>Sort by total price</span>
          <select value={sortOrder} onChange={(event) => onSortChange(event.target.value)}>
            <option value="asc">Lowest to highest</option>
            <option value="desc">Highest to lowest</option>
          </select>
        </label>
      </div>

      <div className="results-grid">
        {rooms.map((room) => {
          const roomKey = getRoomKey(room);
          const isSelected = roomKey === selectedRoomKey;

          return (
            <article
              key={roomKey}
              className={`room-card${isSelected ? " selected" : ""}`}
              aria-selected={isSelected}
            >
              <header className="room-card-header">
                <span className="provider-badge">{room.providerName}</span>
                <span className="room-type">{room.roomType}</span>
              </header>

              <dl className="room-meta">
                <div>
                  <dt>Per night</dt>
                  <dd>{formatCurrency(room.perNightRate)}</dd>
                </div>
                <div>
                  <dt>Total price</dt>
                  <dd>{formatCurrency(room.totalPrice)}</dd>
                </div>
                <div>
                  <dt>Cancellation policy</dt>
                  <dd>{room.cancellationPolicy}</dd>
                </div>
                {room.starRating != null && (
                <div>
                <dt>Star rating</dt>
                <dd>{"⭐".repeat(room.starRating)} ({room.starRating}/5)</dd>
                </div>
               )}
               {room.amenities?.length > 0 && (
               <div>
               <dt>Amenities</dt>
              <dd>{room.amenities.join(", ")}</dd>
              </div>
              )}
              </dl>

              <button
                type="button"
                className="select-room-button"
                onClick={() => onSelectRoom(roomKey)}
              >
                {isSelected ? "Selected for reservation" : "Select room"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export { getRoomKey };
export default SearchResultsView;
