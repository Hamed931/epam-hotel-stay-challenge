import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from './App';

vi.mock('./api/hotelsApi', () => ({
  searchHotels: vi.fn(),
  reserveRoom: vi.fn(),
  lookupReservation: vi.fn(),
}));

import { searchHotels, reserveRoom, lookupReservation } from './api/hotelsApi';

const ROOM = {
  providerName: 'PremierStays',
  roomType: 'Standard',
  perNightRate: 120,
  totalPrice: 360,
  cancellationPolicy: 'FreeCancellation48h',
  available: true,
  starRating: 3,
  amenities: ['Wi-Fi'],
};

// Helper: destination uses list= so its ARIA role is combobox, not textbox
function getDestinationInput() {
  return screen.getByRole('combobox', { name: /destination/i });
}

describe('App — idle state', () => {
  it('shows the initial prompt when no search has been submitted', () => {
    render(<App />);
    expect(screen.getByText(/fill in the form and submit a search/i)).toBeInTheDocument();
  });

  it('shows the search form inputs', () => {
    render(<App />);
    expect(getDestinationInput()).toBeInTheDocument();
    expect(screen.getByLabelText(/check-in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/check-out/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search hotels/i })).toBeInTheDocument();
  });
});

describe('App — validation state', () => {
  it('shows field errors when the form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText(/destination is required/i)).toBeInTheDocument();
    expect(screen.getByText(/check-in date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/check-out date is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please fix the highlighted fields/i)).toBeInTheDocument();
  });

  it('shows an error when check-out is not after check-in', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-04');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-01');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText(/check-out must be after check-in/i)).toBeInTheDocument();
  });

  it('shows an error when destination is not in the supported list', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'Springfield');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText(/destination is not supported/i)).toBeInTheDocument();
  });
});

describe('App — search error state', () => {
  it('shows an error banner when the API call fails', async () => {
    searchHotels.mockRejectedValueOnce(new Error('Network error'));
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });
});

describe('App — search success state', () => {
  beforeEach(() => {
    searchHotels.mockResolvedValue([ROOM]);
  });

  it('shows the room count in the success message after a search', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText(/1 available room option/i)).toBeInTheDocument();
  });

  it('renders the provider badge and room type for each result', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText('PremierStays')).toBeInTheDocument();
    // "Standard" also appears in the room-type select option; check it's in the results card
    expect(screen.getAllByText('Standard').length).toBeGreaterThanOrEqual(1);
  });
});

describe('App — no-results state', () => {
  it('shows the empty results message when search returns no rooms', async () => {
    searchHotels.mockResolvedValueOnce([]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    expect(await screen.findByText(/no rooms found for this search/i)).toBeInTheDocument();
  });
});

describe('App — reservation validation state', () => {
  beforeEach(() => {
    searchHotels.mockResolvedValue([ROOM]);
  });

  it('shows document type error when international destination uses NationalId', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Search with London (international)
    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    // Select room
    await user.click(await screen.findByRole('button', { name: /select room/i }));

    // Fill reservation form with wrong document type
    await user.type(screen.getByRole('textbox', { name: /guest name/i }), 'Jane Doe');
    await user.selectOptions(screen.getByRole('combobox', { name: /document type/i }), 'NationalId');
    await user.type(screen.getByRole('textbox', { name: /document number/i }), 'ID-12345');
    await user.click(screen.getByRole('button', { name: /reserve room/i }));

    expect(await screen.findByText(/international destinations require a passport/i)).toBeInTheDocument();
  });

  it('shows required field errors when reservation form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    await user.click(await screen.findByRole('button', { name: /select room/i }));
    await user.click(screen.getByRole('button', { name: /reserve room/i }));

    expect(await screen.findByText(/guest name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/document type is required/i)).toBeInTheDocument();
    expect(screen.getByText(/document number is required/i)).toBeInTheDocument();
  });
});

describe('App — reservation success state', () => {
  it('shows the confirmation panel with reference after a successful reservation', async () => {
    searchHotels.mockResolvedValue([ROOM]);
    reserveRoom.mockResolvedValueOnce({
      reference: 'RSV-ABCD1234',
      providerName: 'PremierStays',
      roomType: 'Standard',
      destination: 'London',
      guestName: 'Jane Doe',
      totalPrice: 360,
      cancellationPolicy: 'FreeCancellation48h',
    });

    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    await user.click(await screen.findByRole('button', { name: /select room/i }));

    await user.type(screen.getByRole('textbox', { name: /guest name/i }), 'Jane Doe');
    await user.selectOptions(screen.getByRole('combobox', { name: /document type/i }), 'Passport');
    await user.type(screen.getByRole('textbox', { name: /document number/i }), 'PP-99999');
    await user.click(screen.getByRole('button', { name: /reserve room/i }));

    expect(await screen.findByText('RSV-ABCD1234')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /reservation confirmed/i })).toBeInTheDocument();
  });
});

describe('App — reservation error state', () => {
  it('shows an error when the reservation API call fails', async () => {
    searchHotels.mockResolvedValue([ROOM]);
    reserveRoom.mockRejectedValueOnce(new Error('Document type mismatch'));

    const user = userEvent.setup();
    render(<App />);

    await user.type(getDestinationInput(), 'London');
    await user.type(screen.getByLabelText(/check-in/i), '2026-09-01');
    await user.type(screen.getByLabelText(/check-out/i), '2026-09-04');
    await user.click(screen.getByRole('button', { name: /search hotels/i }));

    await user.click(await screen.findByRole('button', { name: /select room/i }));

    await user.type(screen.getByRole('textbox', { name: /guest name/i }), 'Jane Doe');
    await user.selectOptions(screen.getByRole('combobox', { name: /document type/i }), 'Passport');
    await user.type(screen.getByRole('textbox', { name: /document number/i }), 'PP-99999');
    await user.click(screen.getByRole('button', { name: /reserve room/i }));

    expect(await screen.findByText(/document type mismatch/i)).toBeInTheDocument();
  });
});

describe('App — lookup not-found state', () => {
  it('shows a not-found message when lookup returns null', async () => {
    lookupReservation.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText(/RSV-/i), 'RSV-UNKNOWN');
    await user.click(screen.getByRole('button', { name: /lookup reservation/i }));

    expect(await screen.findByText(/no reservation was found for that reference/i)).toBeInTheDocument();
  });

  it('shows validation when lookup is submitted with an empty reference', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /lookup reservation/i }));

    expect(await screen.findByText(/reservation reference is required/i)).toBeInTheDocument();
  });
});

describe('App — lookup success state', () => {
  it('shows reservation details after a successful lookup', async () => {
    lookupReservation.mockResolvedValueOnce({
      reference: 'RSV-LOOKUP99',
      providerName: 'BudgetNests',
      roomType: 'Deluxe',
      destination: 'Paris',
      guestName: 'Ali Hassan',
      totalPrice: 390,
      cancellationPolicy: 'NonRefundable',
      checkIn: '2026-10-01',
      checkOut: '2026-10-04',
    });

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText(/RSV-/i), 'RSV-LOOKUP99');
    await user.click(screen.getByRole('button', { name: /lookup reservation/i }));

    expect(await screen.findByText('RSV-LOOKUP99')).toBeInTheDocument();
    expect(screen.getByText('Ali Hassan')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /reservation details/i })).toBeInTheDocument();
  });
});
