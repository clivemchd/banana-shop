import { test, expect, describe, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderInContext, mockServer } from 'wasp/client/test';
import userEvent from '@testing-library/user-event';
import { useAuth } from 'wasp/client/auth';
import Navbar from '../../pages/landing/navbar';

// Mock the auth hook
vi.mock('wasp/client/auth', () => ({
  useAuth: vi.fn(),
  logout: vi.fn()
}));

const { mockQuery } = mockServer();

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders navbar for unauthenticated user', () => {
    (useAuth as any).mockReturnValue({ data: null });

    renderInContext(<Navbar />);

    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  test('renders navbar for authenticated user', () => {
    (useAuth as any).mockReturnValue({
      data: { id: 'user-123', email: 'test@example.com' }
    });

    renderInContext(<Navbar />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  test('handles navigation section clicks', async () => {
    (useAuth as any).mockReturnValue({ data: null });
    
    // Mock window.location and scrollIntoView
    const mockScrollIntoView = vi.fn();
    const mockGetElementById = vi.fn().mockReturnValue({
      scrollIntoView: mockScrollIntoView
    });
    
    Object.defineProperty(document, 'getElementById', {
      value: mockGetElementById,
      writable: true
    });

    renderInContext(<Navbar />);

    const featuresLink = screen.getByText(/features/i);
    fireEvent.click(featuresLink);

    await waitFor(() => {
      expect(mockGetElementById).toHaveBeenCalledWith('features');
    });
  });

  test('displays user avatar and dropdown when authenticated', async () => {
    (useAuth as any).mockReturnValue({
      data: { id: 'user-123', email: 'test@example.com' }
    });

    renderInContext(<Navbar />);

    const userButton = screen.getByRole('button');
    expect(userButton).toBeInTheDocument();
  });
});