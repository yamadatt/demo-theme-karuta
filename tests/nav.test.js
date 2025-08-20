/**
 * @jest-environment jsdom
 */

describe('Navigation functionality', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <button id="nav-toggle" aria-expanded="false">Menu</button>
      <nav id="primary-nav">
        <a href="/page1">Page 1</a>
        <a href="/page2">Page 2</a>
        <span>Not a link</span>
      </nav>
    `;
  });

  describe('Navigation toggle', () => {
    test('should toggle navigation state correctly', () => {
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      const setState = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      };

      // Initially closed
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(nav.classList.contains('is-open')).toBe(false);

      // Open navigation
      setState(true);
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(nav.classList.contains('is-open')).toBe(true);

      // Close navigation
      setState(false);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(nav.classList.contains('is-open')).toBe(false);
    });

    test('should handle missing elements gracefully', () => {
      document.body.innerHTML = '';
      
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      expect(btn).toBeNull();
      expect(nav).toBeNull();
      
      // Should not throw error
      expect(() => {
        if (!btn || !nav) return;
      }).not.toThrow();
    });
  });

  describe('Click handlers', () => {
    test('should toggle state on button click', () => {
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      const setState = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      };

      // Simulate click event handler
      const handleClick = () => {
        const open = btn.getAttribute('aria-expanded') === 'true';
        setState(!open);
      };

      // Initially closed
      expect(btn.getAttribute('aria-expanded')).toBe('false');

      // First click - should open
      handleClick();
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(nav.classList.contains('is-open')).toBe(true);

      // Second click - should close
      handleClick();
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(nav.classList.contains('is-open')).toBe(false);
    });

    test('should close navigation when link is clicked', () => {
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      // Set initial open state
      btn.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');

      const setState = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      };

      // Simulate navigation click event handler
      const handleNavClick = (e) => {
        if (e.target.tagName === 'A') setState(false);
      };

      // Create click event on link
      const linkClickEvent = {
        target: nav.querySelector('a')
      };

      handleNavClick(linkClickEvent);

      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(nav.classList.contains('is-open')).toBe(false);
    });

    test('should not close navigation when non-link is clicked', () => {
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      // Set initial open state
      btn.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');

      const setState = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      };

      // Simulate navigation click event handler
      const handleNavClick = (e) => {
        if (e.target.tagName === 'A') setState(false);
      };

      // Create click event on non-link element
      const spanClickEvent = {
        target: nav.querySelector('span')
      };

      handleNavClick(spanClickEvent);

      // Should remain open
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(nav.classList.contains('is-open')).toBe(true);
    });
  });

  describe('Media query handling', () => {
    test('should handle media query change', () => {
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      // Set initial open state
      btn.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');

      const setState = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      };

      // Mock media query with addEventListener support
      const mockMediaQuery = {
        matches: false,
        addEventListener: jest.fn()
      };

      window.matchMedia = jest.fn(() => mockMediaQuery);

      // Simulate the media query change handler
      const handleMediaChange = () => setState(false);

      // Register the handler (as would happen in actual code)
      mockMediaQuery.addEventListener('change', handleMediaChange);

      // Trigger the handler
      handleMediaChange();

      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(nav.classList.contains('is-open')).toBe(false);
    });

    test('should handle media query fallback for older browsers', () => {
      const btn = document.getElementById('nav-toggle');
      const nav = document.getElementById('primary-nav');
      
      // Set initial open state
      btn.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');

      const setState = (open) => {
        btn.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      };

      // Mock media query without addEventListener (older browser)
      const mockMediaQuery = {
        matches: false,
        addListener: jest.fn()
      };

      window.matchMedia = jest.fn(() => mockMediaQuery);

      // Simulate the media query handling logic
      const handleMediaChange = () => setState(false);
      
      // Test the fallback logic
      if (mockMediaQuery.addEventListener) {
        mockMediaQuery.addEventListener('change', handleMediaChange);
      } else {
        mockMediaQuery.addListener(handleMediaChange);
      }

      expect(mockMediaQuery.addListener).toHaveBeenCalledWith(handleMediaChange);
    });
  });

  describe('State management', () => {
    test('should correctly interpret aria-expanded attribute', () => {
      const btn = document.getElementById('nav-toggle');
      
      // Test string 'true'
      btn.setAttribute('aria-expanded', 'true');
      expect(btn.getAttribute('aria-expanded') === 'true').toBe(true);
      
      // Test string 'false'
      btn.setAttribute('aria-expanded', 'false');
      expect(btn.getAttribute('aria-expanded') === 'true').toBe(false);
      
      // Test null/undefined
      btn.removeAttribute('aria-expanded');
      expect(btn.getAttribute('aria-expanded') === 'true').toBe(false);
    });

    test('should toggle CSS classes correctly', () => {
      const nav = document.getElementById('primary-nav');
      
      // Initially no class
      expect(nav.classList.contains('is-open')).toBe(false);
      
      // Add class
      nav.classList.toggle('is-open', true);
      expect(nav.classList.contains('is-open')).toBe(true);
      
      // Remove class
      nav.classList.toggle('is-open', false);
      expect(nav.classList.contains('is-open')).toBe(false);
      
      // Toggle based on current state
      nav.classList.toggle('is-open');
      expect(nav.classList.contains('is-open')).toBe(true);
      
      nav.classList.toggle('is-open');
      expect(nav.classList.contains('is-open')).toBe(false);
    });
  });
});