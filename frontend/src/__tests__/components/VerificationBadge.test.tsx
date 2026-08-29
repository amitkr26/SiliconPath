import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import VerificationBadge from '@/components/VerificationBadge';

describe('VerificationBadge Runtime Boundary & Trust Verification', () => {
  // Case 1: Strictly verified
  it('1. status = "verified" renders "Official Link Verified"', () => {
    const { getByText, queryByText } = render(<VerificationBadge status="verified" />);
    expect(getByText('Official Link Verified')).toBeInTheDocument();
    expect(queryByText('Pending Verification')).not.toBeInTheDocument();
  });

  // Case 2: status = "pending"
  it('2. status = "pending" does NOT render "Official Link Verified", renders "Pending Verification"', () => {
    const { queryByText, getByText } = render(<VerificationBadge status="pending" />);
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
    expect(getByText('Pending Verification')).toBeInTheDocument();
  });

  // Case 3: status = null
  it('3. status = null does NOT render "Official Link Verified", renders safe fallback', () => {
    const { queryByText, getByText } = render(<VerificationBadge status={null as any} />);
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
    expect(getByText('Pending Verification')).toBeInTheDocument();
  });

  // Case 4: status = undefined
  it('4. status = undefined does NOT render "Official Link Verified", renders safe fallback', () => {
    const { queryByText, getByText } = render(<VerificationBadge status={undefined} />);
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
    expect(getByText('Pending Verification')).toBeInTheDocument();
  });

  // Case 5: status = "" (empty string)
  it('5. status = "" does NOT render "Official Link Verified", renders safe fallback', () => {
    const { queryByText, getByText } = render(<VerificationBadge status={"" as any} />);
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
    expect(getByText('Pending Verification')).toBeInTheDocument();
  });

  // Case 6: status = "unverified"
  it('6. status = "unverified" does NOT render "Official Link Verified", renders "Pending Verification"', () => {
    const { queryByText, getByText } = render(<VerificationBadge status="unverified" />);
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
    expect(getByText('Pending Verification')).toBeInTheDocument();
  });

  // Case 7: status = "auto_verified" (legacy non-canonical status)
  it('7. status = "auto_verified" does NOT render "Official Link Verified"', () => {
    const { queryByText } = render(<VerificationBadge status={"auto_verified" as any} />);
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
  });

  // Case 8: status = "link_unavailable"
  it('8. status = "link_unavailable" renders "Check Official Site"', () => {
    const { getByText, queryByText } = render(<VerificationBadge status="link_unavailable" />);
    expect(getByText('Check Official Site')).toBeInTheDocument();
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
  });

  // Case 9: status = "rejected"
  it('9. status = "rejected" renders "Verification Rejected"', () => {
    const { getByText, queryByText } = render(<VerificationBadge status="rejected" />);
    expect(getByText('Verification Rejected')).toBeInTheDocument();
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
  });

  // Case 10: status = "expired"
  it('10. status = "expired" renders "Expired"', () => {
    const { getByText, queryByText } = render(<VerificationBadge status="expired" />);
    expect(getByText('Expired')).toBeInTheDocument();
    expect(queryByText('Official Link Verified')).not.toBeInTheDocument();
  });

  // Compact variant
  it('compact mode renders compact label without breaking', () => {
    const { getByText } = render(<VerificationBadge status="pending" compact />);
    expect(getByText('Pending')).toBeInTheDocument();
  });
});
