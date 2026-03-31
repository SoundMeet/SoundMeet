// Mock user data – swap this out when real auth is integrated.
// Replace MOCK_AUTHENTICATED_USER with data from your auth provider.

export const MOCK_AUTHENTICATED_USER = {
  id: 'user-001',
  name: 'Alex Rivera',
  username: '@alexrivera',
  avatarUrl: null, // Set to an image URL to test image avatar; null uses initials fallback
  isAuthenticated: true,
}

export const MOCK_GUEST = {
  id: null,
  name: null,
  username: null,
  avatarUrl: null,
  isAuthenticated: false,
}
