import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ReservationForm from './ReservationForm';

const SELECTED_ROOM = {
  providerName: 'PremierStays',
  roomType: 'Deluxe',
  perNightRate: 180,
  totalPrice: 540,
  cancellationPolicy: 'FreeCancellation48h',
};

const EMPTY_FORM = { guestName: '', documentType: '', documentNumber: '' };

describe('ReservationForm — hidden state', () => {
  it('renders nothing when no room is selected', () => {
    const { container } = render(
      <ReservationForm
        selectedRoom={null}
        destination="London"
        checkIn="2026-09-01"
        checkOut="2026-09-04"
        form={EMPTY_FORM}
        errors={{}}
        isSubmitting={false}
        statusMessage=""
        statusType="idle"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ReservationForm — visible state', () => {
  it('renders the reservation form when a room is selected', () => {
    render(
      <ReservationForm
        selectedRoom={SELECTED_ROOM}
        destination="London"
        checkIn="2026-09-01"
        checkOut="2026-09-04"
        form={EMPTY_FORM}
        errors={{}}
        isSubmitting={false}
        statusMessage=""
        statusType="idle"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('textbox', { name: /guest name/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /document type/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /document number/i })).toBeInTheDocument();
  });

  it('shows field-level validation error messages', () => {
    render(
      <ReservationForm
        selectedRoom={SELECTED_ROOM}
        destination="London"
        checkIn="2026-09-01"
        checkOut="2026-09-04"
        form={EMPTY_FORM}
        errors={{
          guestName: 'Guest name is required.',
          documentType: 'International destinations require a Passport.',
          documentNumber: 'Document number is required.',
        }}
        isSubmitting={false}
        statusMessage=""
        statusType="idle"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Guest name is required.')).toBeInTheDocument();
    expect(screen.getByText('International destinations require a Passport.')).toBeInTheDocument();
    expect(screen.getByText('Document number is required.')).toBeInTheDocument();
  });

  it('disables the submit button while submitting', () => {
    render(
      <ReservationForm
        selectedRoom={SELECTED_ROOM}
        destination="London"
        checkIn="2026-09-01"
        checkOut="2026-09-04"
        form={EMPTY_FORM}
        errors={{}}
        isSubmitting={true}
        statusMessage=""
        statusType="idle"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /reserving/i })).toBeDisabled();
  });

  it('shows API error status message', () => {
    render(
      <ReservationForm
        selectedRoom={SELECTED_ROOM}
        destination="London"
        checkIn="2026-09-01"
        checkOut="2026-09-04"
        form={EMPTY_FORM}
        errors={{}}
        isSubmitting={false}
        statusMessage="Unable to complete reservation."
        statusType="error"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/unable to complete reservation/i)).toBeInTheDocument();
  });

  it('calls onChange when an input changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ReservationForm
        selectedRoom={SELECTED_ROOM}
        destination="London"
        checkIn="2026-09-01"
        checkOut="2026-09-04"
        form={EMPTY_FORM}
        errors={{}}
        isSubmitting={false}
        statusMessage=""
        statusType="idle"
        onChange={onChange}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByRole('textbox', { name: /guest name/i }), 'A');
    expect(onChange).toHaveBeenCalled();
  });
});
