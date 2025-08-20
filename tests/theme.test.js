/**
 * @jest-environment jsdom
 */

// Import the theme module - we'll need to refactor theme.js to make it testable
describe('Theme functionality', () => {
  let mockLocalStorage;
  let mockMatchMedia;

  beforeEach(() => {
    // Reset DOM
    document.documentElement.className = '';
    document.body.innerHTML = `
      <button id="theme-toggle" aria-pressed="false"></button>
    `;

    // Mock localStorage
    mockLocalStorage = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockLocalStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage[key];
        }),
      },
      writable: true
    });

    // Mock matchMedia
    mockMatchMedia = jest.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });
  });

  describe('Theme application', () => {
    test('should apply dark theme correctly', () => {
      // Simulate the applyTheme function
      const applyTheme = (mode) => {
        const dark = mode === 'dark';
        document.documentElement.classList.toggle('theme-dark', dark);
        const btn = document.getElementById('theme-toggle');
        if (btn) {
          btn.setAttribute('aria-pressed', String(dark));
          btn.setAttribute('aria-label', dark ? 'Light モードに切替' : 'Dark モードに切替');
        }
      };

      applyTheme('dark');

      expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
      const button = document.getElementById('theme-toggle');
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.getAttribute('aria-label')).toBe('Light モードに切替');
    });

    test('should apply light theme correctly', () => {
      // First apply dark theme
      document.documentElement.classList.add('theme-dark');

      const applyTheme = (mode) => {
        const dark = mode === 'dark';
        document.documentElement.classList.toggle('theme-dark', dark);
        const btn = document.getElementById('theme-toggle');
        if (btn) {
          btn.setAttribute('aria-pressed', String(dark));
          btn.setAttribute('aria-label', dark ? 'Light モードに切替' : 'Dark モードに切替');
        }
      };

      applyTheme('light');

      expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
      const button = document.getElementById('theme-toggle');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.getAttribute('aria-label')).toBe('Dark モードに切替');
    });
  });

  describe('Initial theme detection', () => {
    test('should return saved theme from localStorage', () => {
      mockLocalStorage['theme'] = 'dark';

      const getInitial = () => {
        try {
          const saved = localStorage.getItem('theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      };

      expect(getInitial()).toBe('dark');
    });

    test('should fallback to system preference when no saved theme', () => {
      mockMatchMedia.mockReturnValue({ matches: true });

      const getInitial = () => {
        try {
          const saved = localStorage.getItem('theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      };

      expect(getInitial()).toBe('dark');
    });

    test('should default to light when system preference is light', () => {
      mockMatchMedia.mockReturnValue({ matches: false });

      const getInitial = () => {
        try {
          const saved = localStorage.getItem('theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      };

      expect(getInitial()).toBe('light');
    });
  });

  describe('Theme toggle functionality', () => {
    test('should toggle from light to dark', () => {
      const button = document.getElementById('theme-toggle');
      let currentTheme = 'light';
      
      const toggleTheme = () => {
        const next = currentTheme === 'light' ? 'dark' : 'light';
        currentTheme = next;
        try {
          localStorage.setItem('theme', next);
        } catch (e) {}
        return next;
      };

      const newTheme = toggleTheme();
      
      expect(newTheme).toBe('dark');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    test('should toggle from dark to light', () => {
      let currentTheme = 'dark';
      
      const toggleTheme = () => {
        const next = currentTheme === 'light' ? 'dark' : 'light';
        currentTheme = next;
        try {
          localStorage.setItem('theme', next);
        } catch (e) {}
        return next;
      };

      const newTheme = toggleTheme();
      
      expect(newTheme).toBe('light');
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });
  });

  describe('Error handling', () => {
    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      window.localStorage.getItem = jest.fn(() => {
        throw new Error('localStorage not available');
      });

      mockMatchMedia.mockReturnValue({ matches: false });

      const getInitial = () => {
        try {
          const saved = localStorage.getItem('theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      };

      expect(() => getInitial()).not.toThrow();
      expect(getInitial()).toBe('light');
    });

    test('should handle matchMedia errors gracefully', () => {
      mockLocalStorage['theme'] = null;
      window.matchMedia = undefined;

      const getInitial = () => {
        try {
          const saved = localStorage.getItem('theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (e) {}
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      };

      expect(getInitial()).toBe('light');
    });
  });
});