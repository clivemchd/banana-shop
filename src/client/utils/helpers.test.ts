import { test, expect } from 'vitest'

// Test the pricing calculations utility functions
test('should calculate plan pricing correctly', () => {
  const calculatePrice = (basePrice: number, billingCycle: 'monthly' | 'annual', annualPrice?: number) => {
    if (billingCycle === 'annual' && annualPrice) {
      return annualPrice
    }
    return billingCycle === 'monthly' ? basePrice : basePrice * 12
  }
  
  expect(calculatePrice(29, 'monthly')).toBe(29)
  expect(calculatePrice(29, 'annual')).toBe(348) // 29 * 12
  expect(calculatePrice(29, 'annual', 290)).toBe(290) // with discount
})

test('should validate email format', () => {
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  expect(isValidEmail('test@example.com')).toBe(true)
  expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
  expect(isValidEmail('invalid-email')).toBe(false)
  expect(isValidEmail('test@')).toBe(false)
  expect(isValidEmail('@example.com')).toBe(false)
  expect(isValidEmail('')).toBe(false)
})

test('should calculate credits correctly', () => {
  const calculateCreditsForOperation = (operation: 'text-to-image' | 'image-to-image', quality: 'standard' | 'hd') => {
    const baseCost = operation === 'text-to-image' ? 1 : 2
    const qualityMultiplier = quality === 'hd' ? 2 : 1
    return baseCost * qualityMultiplier
  }
  
  expect(calculateCreditsForOperation('text-to-image', 'standard')).toBe(1)
  expect(calculateCreditsForOperation('text-to-image', 'hd')).toBe(2)
  expect(calculateCreditsForOperation('image-to-image', 'standard')).toBe(2)
  expect(calculateCreditsForOperation('image-to-image', 'hd')).toBe(4)
})

test('should check if user has enough credits', () => {
  const hasEnoughCredits = (userCredits: number, requiredCredits: number) => {
    return userCredits >= requiredCredits
  }
  
  expect(hasEnoughCredits(100, 50)).toBe(true)
  expect(hasEnoughCredits(100, 100)).toBe(true)
  expect(hasEnoughCredits(100, 150)).toBe(false)
  expect(hasEnoughCredits(0, 1)).toBe(false)
})