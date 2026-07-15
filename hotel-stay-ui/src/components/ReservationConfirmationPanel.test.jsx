import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReservationConfirmationPanel from './ReservationConfirmationPanel';

const CONFIRMATION = {
  reference: 'RSV-TEST9999',
  providerName: 'PremierStays',
  roomType: 'Suite',
  destination: 'Tokyo',
  guestName: 'Aiko Tanaka',
  totalPrice: 780,
  cancellationPolicy: 'NonRefundable',
  checkIn: '2026-11-10',
  checkOut: '2026-11-13',
};

describe('ReservationConfirmationPanel — hidden state', () => {
  it('renders nothing when confirmation is null', () => {
    const { container } = render(<ReservationConfirmationPanel confirmation={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ReservationConfirmationPanel — success state', () => {
  it('displays the reservation reference prominently', () => {
    render(<ReservationConfirmationPanel confirmation={CONFIRMATION} />);
    expect(screen.getByText('RSV-TEST9999')).toBeInTheDocument();
  });

  it('displays guest name, provider, room type, and destination', () => {
    render(<ReservationConfirmationPanel confirmation={CONFIRMATION} />);
    expect(screen.getByText('Aiko Tanaka')).toBeInTheDocument();
    expect(screen.getByText('PremierStays')).toBeInTheDocument();
    expect(screen.getByText('Suite')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
  });

  it('uses the default title "Reservation confirmed"', () => {
    render(<ReservationConfirmationPanel confirmation={CONFIRMATION} />);
    expect(screen.getByText(/reservation confirmed/i)).toBeInTheDocument();
  });

  it('accepts a custom title', () => {
    render(
      <ReservationConfirmationPanel
        confirmation={CONFIRMATION}
        title="Reservation details"
      />,
    );
    expect(screen.getByText(/reservation details/i)).toBeInTheDocument();
  });

  it('formats check-in and check-out dates', () => {
    render(<ReservationConfirmationPanel confirmation={CONFIRMATION} />);
    // Both check-in (Nov 10) and check-out (Nov 13) are formatted and rendered
    const dateElements = screen.getAllByText(/nov/i);
    expect(dateElements.length).toBeGreaterThanOrEqual(2);
  });
});
