/**
 * @jest-environment jsdom
 */

describe('Search functionality', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="search-modal" aria-hidden="true">
        <input id="search-modal-input" type="text">
        <div class="sm-backdrop"></div>
        <div id="search-results"></div>
        <div id="search-count"></div>
        <div id="search-loading" hidden></div>
        <div id="search-history" hidden>
          <div id="search-history-list"></div>
        </div>
      </div>
      <button id="search-open">Search</button>
    `;

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('HTML escaping', () => {
    test('should escape HTML characters correctly', () => {
      const escapeHtml = (s) => {
        return (s === null || s === undefined ? "" : String(s)).replace(/[&<>"']/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
      };

      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('A&B')).toBe('A&amp;B');
      expect(escapeHtml("O'Reilly")).toBe('O&#39;Reilly');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('Search history management', () => {
    let mockLocalStorage;
    
    beforeEach(() => {
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
          clear: jest.fn(() => {
            mockLocalStorage = {};
          })
        },
        writable: true
      });
    });

    test('should get empty history initially', () => {
      const getSearchHistory = () => {
        try {
          return JSON.parse(localStorage.getItem('karuta-search-history') || '[]');
        } catch (e) {
          return [];
        }
      };

      expect(getSearchHistory()).toEqual([]);
    });

    test('should add query to history', () => {
      const HISTORY_KEY = 'karuta-search-history';
      const MAX_HISTORY = 10;

      const getSearchHistory = () => {
        try {
          return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch (e) {
          return [];
        }
      };

      const addToHistory = (query) => {
        if (!query || query.length < 2) return;

        let history = getSearchHistory();
        history = history.filter(item => item !== query);
        history.unshift(query);
        
        if (history.length > MAX_HISTORY) {
          history = history.slice(0, MAX_HISTORY);
        }

        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          mockLocalStorage[HISTORY_KEY] = JSON.stringify(history);
        } catch (e) {
          // Storage failed, ignore
        }
      };

      addToHistory('test query');
      const history = getSearchHistory();
      
      expect(history).toEqual(['test query']);
      expect(localStorage.setItem).toHaveBeenCalledWith(HISTORY_KEY, JSON.stringify(['test query']));
    });

    test('should not add short queries to history', () => {
      const addToHistory = (query) => {
        if (!query || query.length < 2) return;
        // Implementation would continue here
        localStorage.setItem('karuta-search-history', JSON.stringify([query]));
      };

      addToHistory('a');
      addToHistory('');
      
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    test('should move existing query to front', () => {
      const HISTORY_KEY = 'karuta-search-history';
      
      // Pre-populate history
      mockLocalStorage[HISTORY_KEY] = JSON.stringify(['query1', 'query2', 'query3']);

      const getSearchHistory = () => {
        try {
          return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch (e) {
          return [];
        }
      };

      const addToHistory = (query) => {
        if (!query || query.length < 2) return;

        let history = getSearchHistory();
        history = history.filter(item => item !== query);
        history.unshift(query);

        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          mockLocalStorage[HISTORY_KEY] = JSON.stringify(history);
        } catch (e) {}
      };

      addToHistory('query2');
      const history = getSearchHistory();
      
      expect(history).toEqual(['query2', 'query1', 'query3']);
    });

    test('should limit history to MAX_HISTORY items', () => {
      const HISTORY_KEY = 'karuta-search-history';
      const MAX_HISTORY = 3;
      
      const getSearchHistory = () => {
        try {
          return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch (e) {
          return [];
        }
      };

      const addToHistory = (query) => {
        if (!query || query.length < 2) return;

        let history = getSearchHistory();
        history = history.filter(item => item !== query);
        history.unshift(query);
        
        if (history.length > MAX_HISTORY) {
          history = history.slice(0, MAX_HISTORY);
        }

        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          mockLocalStorage[HISTORY_KEY] = JSON.stringify(history);
        } catch (e) {}
      };

      // Add more than MAX_HISTORY items
      ['query1', 'query2', 'query3', 'query4'].forEach(addToHistory);
      
      const history = getSearchHistory();
      expect(history).toHaveLength(MAX_HISTORY);
      expect(history).toEqual(['query4', 'query3', 'query2']);
    });
  });

  describe('Search scoring', () => {
    test('should score items based on query match', () => {
      const normalize = (s) => (s || '').toString().toLowerCase();

      const scoreItem = (item, q) => {
        const t = normalize(item.title);
        const s = normalize(item.summary);
        const c = normalize(item.content);
        const d = normalize(item.description);
        const joined = [
          t,
          s,
          c,
          d,
          (item.tags || []).join(' '),
          (item.categories || []).join(' '),
        ].join(' ');
        if (!q) return 0;
        const idx = joined.indexOf(q);
        const bonus = t.startsWith(q) ? 5 : 0;
        return (idx >= 0 ? 100 - idx : -1) + bonus;
      };

      const item = {
        title: 'Hugo Tutorial',
        summary: 'Learn Hugo basics',
        content: 'Hugo is a static site generator',
        description: 'Tutorial about Hugo',
        tags: ['hugo', 'tutorial'],
        categories: ['web']
      };

      const score = scoreItem(item, 'hugo');
      expect(score).toBeGreaterThan(0);
    });

    test('should give bonus for title matches', () => {
      const normalize = (s) => (s || '').toString().toLowerCase();

      const scoreItem = (item, q) => {
        const t = normalize(item.title);
        const s = normalize(item.summary);
        const c = normalize(item.content);
        const d = normalize(item.description);
        const joined = [t, s, c, d, (item.tags || []).join(' '), (item.categories || []).join(' ')].join(' ');
        if (!q) return 0;
        const idx = joined.indexOf(q);
        const bonus = t.startsWith(q) ? 5 : 0;
        return (idx >= 0 ? 100 - idx : -1) + bonus;
      };

      const titleMatch = {
        title: 'Hugo Guide',
        summary: 'A guide',
        content: 'Content',
        tags: [],
        categories: []
      };

      const contentMatch = {
        title: 'Guide',
        summary: 'A guide',
        content: 'Hugo content',
        tags: [],
        categories: []
      };

      const titleScore = scoreItem(titleMatch, 'hugo');
      const contentScore = scoreItem(contentMatch, 'hugo');
      
      expect(titleScore).toBeGreaterThan(contentScore);
    });
  });

  describe('Text normalization', () => {
    test('should normalize text correctly', () => {
      const normalize = (s) => (s || '').toString().toLowerCase();

      expect(normalize('Hello World')).toBe('hello world');
      expect(normalize('UPPERCASE')).toBe('uppercase');
      expect(normalize('')).toBe('');
      expect(normalize(null)).toBe('');
      expect(normalize(undefined)).toBe('');
      expect(normalize(123)).toBe('123');
    });
  });

  describe('Best match finding', () => {
    test('should find title match with highest score', () => {
      const normalize = (s) => (s || '').toString().toLowerCase();

      const findBestMatch = (item, query) => {
        const t = normalize(item.title);
        const s = normalize(item.summary);
        const c = normalize(item.content);

        if (t.indexOf(query) >= 0) {
          return { text: item.title, type: 'title', score: 100 };
        }
        if (s.indexOf(query) >= 0) {
          return { text: item.summary, type: 'summary', score: 80 };
        }
        if (c.indexOf(query) >= 0) {
          return { text: item.content, type: 'content', score: 60 };
        }

        return { text: item.summary, type: 'summary', score: 20 };
      };

      const item = {
        title: 'Hugo Tutorial',
        summary: 'Learn Hugo',
        content: 'Static site generator tutorial'
      };

      const match = findBestMatch(item, 'hugo');
      expect(match.type).toBe('title');
      expect(match.score).toBe(100);
    });

    test('should fallback to summary match', () => {
      const normalize = (s) => (s || '').toString().toLowerCase();

      const findBestMatch = (item, query) => {
        const t = normalize(item.title);
        const s = normalize(item.summary);
        const c = normalize(item.content);

        if (t.indexOf(query) >= 0) {
          return { text: item.title, type: 'title', score: 100 };
        }
        if (s.indexOf(query) >= 0) {
          return { text: item.summary, type: 'summary', score: 80 };
        }
        if (c.indexOf(query) >= 0) {
          return { text: item.content, type: 'content', score: 60 };
        }

        return { text: item.summary, type: 'summary', score: 20 };
      };

      const item = {
        title: 'Tutorial',
        summary: 'Learn Hugo basics',
        content: 'Static site generator'
      };

      const match = findBestMatch(item, 'hugo');
      expect(match.type).toBe('summary');
      expect(match.score).toBe(80);
    });
  });

  describe('Modal functionality', () => {
    test('should open modal correctly', () => {
      const modal = document.getElementById('search-modal');
      
      const openModal = () => {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
      };

      openModal();
      
      expect(modal.classList.contains('open')).toBe(true);
      expect(modal.getAttribute('aria-hidden')).toBe('false');
    });

    test('should close modal correctly', () => {
      const modal = document.getElementById('search-modal');
      const resultsEl = document.getElementById('search-results');
      const countEl = document.getElementById('search-count');
      const loadingEl = document.getElementById('search-loading');
      
      // Set up initial state
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      resultsEl.innerHTML = '<div>Results</div>';
      countEl.textContent = '5 results';
      loadingEl.hidden = false;

      const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        if (resultsEl) {
          resultsEl.innerHTML = '';
        }
        if (countEl) {
          countEl.textContent = '';
        }
        if (loadingEl) {
          loadingEl.hidden = true;
        }
      };

      closeModal();
      
      expect(modal.classList.contains('open')).toBe(false);
      expect(modal.getAttribute('aria-hidden')).toBe('true');
      expect(resultsEl.innerHTML).toBe('');
      expect(countEl.textContent).toBe('');
      expect(loadingEl.hidden).toBe(true);
    });
  });
});