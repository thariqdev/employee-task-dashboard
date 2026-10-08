import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';
import Select from './Select';

const OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'DONE', label: 'Completed' },
];

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Select label="Filter by status" value={value} options={OPTIONS} onChange={setValue} />
      <p>Current: {value || 'nothing'}</p>
      <button>Elsewhere</button>
    </>
  );
}

const combobox = () => screen.getByRole('combobox', { name: 'Filter by status' });

describe('Select', () => {
  it('shows the chosen option and keeps the list closed', () => {
    render(<Harness initial="PENDING" />);
    expect(combobox()).toHaveTextContent('Pending');
    expect(combobox()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens a list of options, marks the chosen one, and picks one by click', async () => {
    const user = userEvent.setup();
    render(<Harness initial="PENDING" />);
    await user.click(combobox());

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['All statuses', 'Pending', 'Completed']);
    expect(screen.getByRole('option', { name: 'Pending' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Completed' })).toHaveAttribute('aria-selected', 'false');

    await user.click(screen.getByRole('option', { name: 'Completed' }));
    expect(screen.getByText('Current: DONE')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox()).toHaveTextContent('Completed');
  });

  it('works from the keyboard: arrows move, Enter picks, Escape closes without picking', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();

    await user.keyboard('{ArrowDown}'); // opens
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(screen.getByText('Current: DONE')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}{ArrowUp}{ArrowUp}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByText('Current: DONE')).toBeInTheDocument(); // Escape did not change the choice
  });

  it('does not run past the first or last option', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
    expect(screen.getByText('Current: DONE')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{Enter}');
    expect(screen.getByText('Current: nothing')).toBeInTheDocument();
  });

  it('closes when the user clicks somewhere else', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(combobox());
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('colors the control only when a real choice is made', () => {
    const { rerender } = render(<Select label="Filter by status" value="" options={OPTIONS} onChange={() => {}} />);
    expect(combobox()).not.toHaveClass('text-accent');
    rerender(<Select label="Filter by status" value="DONE" options={OPTIONS} onChange={() => {}} />);
    expect(combobox()).toHaveClass('text-accent');
  });

  it('shows the icon of an option in the list and on the closed control', async () => {
    const user = userEvent.setup();
    const options = [
      { value: 'A', label: 'Alpha', icon: <i data-testid="icon-a" /> },
      { value: 'B', label: 'Beta', icon: <i data-testid="icon-b" /> },
    ];
    render(<Select label="Letter" value="B" options={options} onChange={() => {}} />);

    expect(screen.getByRole('combobox', { name: 'Letter' })).toContainElement(screen.getByTestId('icon-b'));
    expect(screen.queryByTestId('icon-a')).not.toBeInTheDocument(); // only the chosen option's icon shows when closed

    await user.click(screen.getByRole('combobox', { name: 'Letter' }));
    expect(screen.getByRole('option', { name: 'Alpha' })).toContainElement(screen.getByTestId('icon-a'));
    expect(screen.getByTestId('icon-a').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('fills the width of a form in the "field" variant and shows the placeholder until a choice is made', () => {
    render(<Select label="Position" variant="field" placeholder="Select a position" value="" options={OPTIONS.slice(1)} onChange={() => {}} />);
    const box = screen.getByRole('combobox', { name: 'Position' });
    expect(box).toHaveClass('w-full');
    expect(box).toHaveTextContent('Select a position');
  });

  it('draws its list on the page itself, not inside a dialog, and stays usable from there', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Form" onClose={() => {}}>
        <Select label="Status" value="" options={OPTIONS} onChange={onChange} />
      </Modal>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Status' }));

    const list = screen.getByRole('listbox');
    expect(screen.getByRole('dialog')).not.toContainElement(list);
    expect(list.parentElement).toBe(document.body);
    expect(list).toHaveStyle({ position: 'fixed' });

    await user.click(screen.getByRole('option', { name: 'Completed' })); // a click out there is not "outside"
    expect(onChange).toHaveBeenCalledWith('DONE');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes only the list, not the dialog, when Escape is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal title="Form" onClose={onClose}>
        <Select label="Status" value="" options={OPTIONS} onChange={() => {}} />
      </Modal>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Status' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
