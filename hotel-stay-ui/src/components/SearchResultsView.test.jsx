import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SearchResultsView from './SearchResultsView';

const makeRoom = (providerName, roomType, perNightRate, totalPrice) => ({
  providerName,
  roomType,
  perNightRate,
  totalPrice,
  cancellationPolicy: 'FreeCancellation48h',
  available: true,
  starRating: 3,
  amenities: [],
});

describe('SearchResultsView — empty state', () => {
  it('shows "No rooms found" when rooms array is empty', () => {
    render(
      <SearchResultsView
        rooms={[]}
        sortOrder="asc"
        onSortChange={vi.fn()}
        selectedRoomKey={null}
        onSelectRoom={vi.fn()}
      />,
    );
    expect(screen.getByText(/no rooms found for this search/i)).toBeInTheDocument();
  });

  it('shows "No rooms found" when rooms is undefined', () => {
    render(
      <SearchResultsView
        rooms={undefined}
        sortOrder="asc"
        onSortChange={vi.fn()}
        selectedRoomKey={null}
        onSelectRoom={vi.fn()}
      />,
    );
    expect(screen.getByText(/no rooms found for this search/i)).toBeInTheDocument();
  });
});

describe('SearchResultsView — results state', () => {
  const rooms = [
    makeRoom('PremierStays', 'Suite', 260, 780),
    makeRoom('BudgetNests', 'Standard', 90, 270),
  ];

  it('shows the room count in the heading', () => {
    render(
      <SearchResultsView
        rooms={rooms}
        sortOrder="asc"
        onSortChange={vi.fn()}
        selectedRoomKey={null}
        onSelectRoom={vi.fn()}
      />,
    );
    expect(screen.getByText(/available rooms \(2\)/i)).toBeInTheDocument();
  });

  it('renders a provider badge and room type for each room', () => {
    render(
      <SearchResultsView
        rooms={rooms}
        sortOrder="asc"
        onSortChange={vi.fn()}
        selectedRoomKey={null}
        onSelectRoom={vi.fn()}
      />,
    );
    expect(screen.getByText('PremierStays')).toBeInTheDocument();
    expect(screen.getByText('BudgetNests')).toBeInTheDocument();
    expect(screen.getByText('Suite')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  it('marks a room as selected when its key matches selectedRoomKey', () => {
    const selectedRoom = rooms[0];
    const selectedKey = `${selectedRoom.providerName}-${selectedRoom.roomType}-${selectedRoom.perNightRate}-${selectedRoom.totalPrice}`;

    render(
      <SearchResultsView
        rooms={rooms}
        sortOrder="asc"
        onSortChange={vi.fn()}
        selectedRoomKey={selectedKey}
        onSelectRoom={vi.fn()}
      />,
    );

    const cards = document.querySelectorAll('.room-card');
    expect(cards[0]).toHaveClass('selected');
    expect(cards[1]).not.toHaveClass('selected');
  });
});

describe('SearchResultsView — sort control', () => {
  it('calls onSortChange when the sort select changes', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const rooms = [makeRoom('PremierStays', 'Standard', 120, 360)];

    render(
      <SearchResultsView
        rooms={rooms}
        sortOrder="asc"
        onSortChange={onSortChange}
        selectedRoomKey={null}
        onSelectRoom={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /sort by total price/i }), 'desc');
    expect(onSortChange).toHaveBeenCalledWith('desc');
  });
});
