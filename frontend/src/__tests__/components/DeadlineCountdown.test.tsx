import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import DeadlineCountdown from '@/components/DeadlineCountdown';

describe('DeadlineCountdown badge variant', () => {
  it('shows muted style for deadline > 7 days away', () => {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    const { container } = render(<DeadlineCountdown deadline={future.toISOString()} />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span!.className).not.toContain('danger');
    expect(span!.className).not.toContain('warning');
    expect(span!.textContent).toMatch(/\d+ days left/);
  });

  it('shows warning style for deadline <= 7 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const { getByText } = render(<DeadlineCountdown deadline={future.toISOString()} />);
    const span = getByText(/Closes in \d+ days/);
    expect(span).toBeInTheDocument();
    expect(span.className).toContain('warning');
  });

  it('shows danger style for deadline <= 3 days', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const { getByText } = render(<DeadlineCountdown deadline={future.toISOString()} />);
    const span = getByText(/Last \d+ days?|Last day/);
    expect(span).toBeInTheDocument();
    expect(span.className).toContain('danger');
  });

  it('shows expired for past deadline', () => {
    const { getByText } = render(<DeadlineCountdown deadline="2020-01-01" />);
    expect(getByText('Expired')).toBeInTheDocument();
  });
});
