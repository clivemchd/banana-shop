import { test, expect, describe } from 'vitest';
import { screen } from '@testing-library/react';
import { renderInContext } from 'wasp/client/test';
import Hero from '../../pages/landing/hero';

describe('Hero Component', () => {
  test('renders hero content correctly', () => {
    renderInContext(<Hero />);
    
    // Check if main heading is rendered
    const heading = screen.getByRole('heading', { 
      name: /AI-Powered Image Generation & Editing Made Simple/i 
    });
    expect(heading).toBeInTheDocument();
  });

  test('displays version badge', () => {
    renderInContext(<Hero />);
    
    const badge = screen.getByText('Just released v1.0.0');
    expect(badge).toBeInTheDocument();
  });

  test('displays description text', () => {
    renderInContext(<Hero />);
    
    const description = screen.getByText(
      /Create stunning images from text and edit them with precision/i
    );
    expect(description).toBeInTheDocument();
  });

  test('renders get started button with correct link', () => {
    renderInContext(<Hero />);
    
    const getStartedButton = screen.getByRole('link');
    expect(getStartedButton).toHaveAttribute('href', '/signin');
    
    const buttonText = screen.getByText('Get Started');
    expect(buttonText).toBeInTheDocument();
  });

  test('has correct styling classes for responsive design', () => {
    renderInContext(<Hero />);
    
    const heroContainer = screen.getByText(/AI-Powered Image Generation/i).closest('div');
    expect(heroContainer?.parentElement?.parentElement).toHaveClass(
      'min-h-[calc(100vh-4rem)]',
      'w-full',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  test('includes video player component', () => {
    renderInContext(<Hero />);
    
    // The video player should be rendered (we can check for the container)
    const videoContainer = document.querySelector('.aspect-square');
    expect(videoContainer).toBeInTheDocument();
  });
});