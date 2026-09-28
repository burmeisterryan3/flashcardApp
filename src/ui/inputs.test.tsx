// Component tests for practice-screen inputs (07 "Component tests for practice screen modes").
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Choices, FractionInput, LetterDiff, NumberPad, TextAnswer } from './inputs';
import { PinPad } from './common';

describe('NumberPad (CM-03)', () => {
  it('types with taps and checks', async () => {
    const onSubmit = vi.fn();
    render(<NumberPad onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    await userEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(onSubmit).toHaveBeenCalledWith('12');
  });
  it('supports the hardware keyboard (AX-03)', () => {
    const onSubmit = vi.fn();
    render(<NumberPad onSubmit={onSubmit} />);
    fireEvent.keyDown(window, { key: '5' });
    fireEvent.keyDown(window, { key: '6' });
    fireEvent.keyDown(window, { key: 'Backspace' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('5');
  });
  it('check is disabled until something is typed', () => {
    render(<NumberPad onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: /Check/ })).toBeDisabled();
  });
});

describe('FractionInput (FR-01)', () => {
  it('builds a mixed number across three boxes', async () => {
    const onSubmit = vi.fn();
    render(<FractionInput withWhole onSubmit={onSubmit} />);
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: 'Tab' });
    fireEvent.keyDown(window, { key: '3' });
    fireEvent.keyDown(window, { key: '/' });
    fireEvent.keyDown(window, { key: '4' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('2 3/4');
  });
  it('accepts a whole number on its own (IF-01, RF-05)', async () => {
    const onSubmit = vi.fn();
    render(<FractionInput withWhole={false} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(onSubmit).toHaveBeenCalledWith('3');
  });
  it('lets the child tap a box to move to it', async () => {
    const onSubmit = vi.fn();
    render(<FractionInput withWhole={false} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /Bottom number/ }));
    await userEvent.click(screen.getByRole('button', { name: '8' }));
    await userEvent.click(screen.getByRole('button', { name: /Top number/ }));
    await userEvent.click(screen.getByRole('button', { name: '6' }));
    await userEvent.click(screen.getByRole('button', { name: /Check/ }));
    expect(onSubmit).toHaveBeenCalledWith('6/8');
  });
});

describe('Choices', () => {
  it('number keys pick an option (AX-03)', () => {
    const onPick = vi.fn();
    render(<Choices options={['Austin', 'Boise', 'Salem']} onPick={onPick} />);
    fireEvent.keyDown(window, { key: '2' });
    expect(onPick).toHaveBeenCalledWith('Boise');
  });
  it('locks after the first answer and marks the right one', async () => {
    const onPick = vi.fn();
    render(<Choices options={['Austin', 'Boise']} onPick={onPick} picked="Boise" correct="Austin" />);
    await userEvent.click(screen.getByRole('button', { name: /Austin/ }));
    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByLabelText('correct answer')).toBeInTheDocument();
  });
});

describe('TextAnswer (S-04 typing)', () => {
  it('turns off autocorrect, autocapitalize and spellcheck — critical for spelling', () => {
    render(<TextAnswer onSubmit={() => {}} label="Type the word" />);
    const input = screen.getByLabelText('Type the word');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });
  it('submits on Enter', async () => {
    const onSubmit = vi.fn();
    render(<TextAnswer onSubmit={onSubmit} label="Answer" />);
    await userEvent.type(screen.getByLabelText('Answer'), 'because{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('because');
  });
});

describe('LetterDiff (CS-05)', () => {
  it('describes the comparison for screen readers', () => {
    render(<LetterDiff given="becuase" answer="because" />);
    expect(screen.getByRole('group')).toHaveAccessibleName(/You wrote b e c u a s e\. The word is b e c a u s e\./);
  });
});

describe('PinPad (CS-02)', () => {
  it('shows all ten digits and completes after four', async () => {
    const done = vi.fn();
    render(<PinPad onComplete={done} />);
    for (const d of '0123456789') expect(screen.getByRole('button', { name: d })).toBeInTheDocument();
    for (const d of '2468') await userEvent.click(screen.getByRole('button', { name: d }));
    expect(done).toHaveBeenCalledWith('2468');
  });
});
