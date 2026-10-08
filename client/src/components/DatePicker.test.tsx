import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { toIso, today } from '../lib/calendar';
import DatePicker from './DatePicker';
import Modal from './Modal';

function Harness({ initial = '2026-10-07', onClose = () => {} }: { initial?: string; onClose?: () => void }) {
  const [value, setValue] = useState(initial);
  return (
    <Modal title="Form" onClose={onClose}>
      <label htmlFor="due">Due date</label>
      <DatePicker id="due" value={value} onChange={setValue} />
      <p>Saved: {value || 'nothing'}</p>
    </Modal>
  );
}

const openCalendar = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Open calendar' }));

describe('DatePicker', () => {
  it('lets the user type a date, and shows it in the text box', async () => {
    const user = userEvent.setup();
    render(<Harness initial="" />);
    await user.type(screen.getByLabelText('Due date'), '2027-01-15');
    expect(screen.getByLabelText('Due date')).toHaveValue('2027-01-15');
    expect(screen.getByText('Saved: 2027-01-15')).toBeInTheDocument();
  });

  it('opens on the month of the chosen date, with that day marked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole('group', { name: 'Calendar' })).not.toBeInTheDocument();
    await openCalendar(user);

    expect(screen.getByText('October 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 October 2026' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '8 October 2026' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('picks a day by click: fills the box and closes the calendar', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openCalendar(user);
    await user.click(screen.getByRole('button', { name: '21 October 2026' }));

    expect(screen.getByLabelText('Due date')).toHaveValue('2026-10-21');
    expect(screen.queryByRole('group', { name: 'Calendar' })).not.toBeInTheDocument();
  });

  it('moves between months and years', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openCalendar(user);

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous year' }));
    expect(screen.getByText('November 2025')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    await user.click(screen.getByRole('button', { name: 'Next year' }));
    expect(screen.getByText('October 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '3 October 2026' }));
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-10-03');
  });

  it('works from the keyboard: arrows move across days and months, Enter picks', async () => {
    const user = userEvent.setup();
    render(<Harness initial="2026-10-31" />);
    await openCalendar(user);
    screen.getByRole('button', { name: '31 October 2026' }).focus();

    await user.keyboard('{ArrowRight}'); // into November
    expect(screen.getByText('November 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 November 2026' })).toHaveFocus();

    await user.keyboard('{ArrowDown}{Enter}'); // a week later
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-11-08');
  });

  it('closes with Escape without closing the dialog around it', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await openCalendar(user);
    screen.getByRole('button', { name: '7 October 2026' }).focus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Calendar' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.keyboard('{Escape}'); // now nothing is open inside, so the dialog closes
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has a Today button, and opens on today when the text is not a date', async () => {
    const user = userEvent.setup();
    render(<Harness initial="nonsense" />);
    await openCalendar(user);
    const now = today();
    expect(screen.getByText(new Date(now.year, now.month, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByLabelText('Due date')).toHaveValue(toIso(now));
  });

  it('is drawn on the page itself, not inside the dialog, so the dialog never grows or scrolls because of it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openCalendar(user);

    const calendar = screen.getByRole('group', { name: 'Calendar' });
    expect(screen.getByRole('dialog')).not.toContainElement(calendar);
    expect(calendar.parentElement).toBe(document.body);
    expect(calendar).toHaveStyle({ position: 'fixed' });
  });

  describe('with a minimum day', () => {
    function MinHarness() {
      const [value, setValue] = useState('2026-10-10');
      return (
        <Modal title="Form" onClose={() => {}}>
          <label htmlFor="due">Due date</label>
          <DatePicker id="due" value={value} onChange={setValue} min="2026-10-07" />
        </Modal>
      );
    }

    it('shows earlier days as unavailable, and ignores a click on one', async () => {
      const user = userEvent.setup();
      render(<MinHarness />);
      await openCalendar(user);

      expect(screen.getByRole('button', { name: '6 October 2026' })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByRole('button', { name: '1 October 2026' })).toHaveAttribute('aria-disabled', 'true');
      await user.click(screen.getByRole('button', { name: '3 October 2026' }));
      expect(screen.getByLabelText('Due date')).toHaveValue('2026-10-10'); // unchanged
      expect(screen.getByRole('group', { name: 'Calendar' })).toBeInTheDocument(); // and still open
    });

    it('allows the minimum day itself and every day after it', async () => {
      const user = userEvent.setup();
      render(<MinHarness />);
      await openCalendar(user);
      expect(screen.getByRole('button', { name: '7 October 2026' })).not.toHaveAttribute('aria-disabled');
      expect(screen.getByRole('button', { name: '8 October 2026' })).not.toHaveAttribute('aria-disabled');

      await user.click(screen.getByRole('button', { name: '7 October 2026' }));
      expect(screen.getByLabelText('Due date')).toHaveValue('2026-10-07');
    });

    it('cannot go back to months that hold no available day, but can go forward', async () => {
      const user = userEvent.setup();
      render(<MinHarness />);
      await openCalendar(user);
      expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Previous year' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByText('November 2026')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled(); // back to October is fine
      expect(screen.getByRole('button', { name: '1 November 2026' })).not.toHaveAttribute('aria-disabled');
    });

    it('lets the arrow keys pass over an unavailable day, but Enter on it picks nothing', async () => {
      const user = userEvent.setup();
      render(<MinHarness />);
      await openCalendar(user);
      screen.getByRole('button', { name: '10 October 2026' }).focus();

      await user.keyboard('{ArrowUp}'); // 3 October: before the minimum
      expect(screen.getByRole('button', { name: '3 October 2026' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByLabelText('Due date')).toHaveValue('2026-10-10');
    });
  });

  it('closes when the user clicks somewhere else', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openCalendar(user);
    await user.click(screen.getByText('Saved: 2026-10-07'));
    expect(screen.queryByRole('group', { name: 'Calendar' })).not.toBeInTheDocument();
  });
});
