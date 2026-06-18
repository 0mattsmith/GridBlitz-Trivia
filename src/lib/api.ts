import { handleOfflineRequest } from './offlineApi';

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.pathname;
  } else if (input && typeof input === 'object' && 'url' in (input as any)) {
    url = (input as any).url;
  }

  // Intercept all API calls
  if (url.includes('/api/')) {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    
    // If not on GitHub Pages, attempt real network call first
    if (!isGitHubPages) {
      try {
        const response = await fetch(input, init);
        // Only return if it's a valid alive server response
        if (response.status !== 404 && response.status !== 502 && response.status !== 504) {
          return response;
        }
      } catch (e) {
        console.warn('[PWA] Real backend server unreachable, falling back to local client database engine:', e);
      }
    }

    // Load offline API handlers
    try {
      const apiPath = url.includes('http') ? new URL(url).pathname : url;
      const method = init?.method || 'GET';
      const bodyObj = init?.body ? JSON.parse(init.body as string) : {};
      
      const resData = await handleOfflineRequest(apiPath, method, bodyObj);
      return new Response(JSON.stringify(resData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (offlineErr) {
      console.error('[PWA Interceptor Error] Failed executing local mock responder:', offlineErr);
    }
  }

  return fetch(input, init);
}
