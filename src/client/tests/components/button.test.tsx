import { test, expect, describe } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderInContext } from 'wasp/client/test';
import { Button } from '../../components/ui/button';

describe('Button Component', () => {
  test('renders button with default props', () => {
    renderInContext(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  test('applies variant classes correctly', () => {
    renderInContext(<Button variant="destructive">Delete</Button>);
    
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  test('applies size classes correctly', () => {
    renderInContext(<Button size="lg">Large Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Large Button' });
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8');
  });

  test('handles click events', () => {
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };

    renderInContext(
      <Button onClick={handleClick}>Click Me</Button>
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);
    
    expect(clicked).toBe(true);
  });

  test('is disabled when disabled prop is true', () => {
    renderInContext(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  test('renders with custom className', () => {
    renderInContext(
      <Button className="custom-class">Custom Button</Button>
    );
    
    const button = screen.getByRole('button', { name: 'Custom Button' });
    expect(button).toHaveClass('custom-class');
  });

  test('renders as child component when asChild is true', () => {
    renderInContext(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });
});