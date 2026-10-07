import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal';

function renderModal() {
  const onClose = vi.fn();
  render(
    <Modal title="Edit thing" onClose={onClose}>
      <button>Inside</button>
    </Modal>,
  );
  return onClose;
}

describe('Modal', () => {
  it('is a dialog labelled by its title', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: 'Edit thing' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onClose = renderModal();
    await userEvent.setup().keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the dark backdrop is clicked, but not when the dialog itself is', () => {
    const onClose = renderModal();
    fireEvent.mouseDown(screen.getByRole('dialog'));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Inside' }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
