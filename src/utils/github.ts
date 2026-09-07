// GitHub repository link helper and safe redirection
export const DEFAULT_GITHUB_REPO = 'https://github.com/jeetron1x/HomeSense-AI';

export const getGitHubRepoUrl = (): string => {
  try {
    const saved = localStorage.getItem('homesense_github_repo');
    if (saved && saved.trim() && !saved.includes('technojeet105520')) {
      return saved.trim();
    }
  } catch {}
  return DEFAULT_GITHUB_REPO;
};

export const setGitHubRepoUrl = (url: string) => {
  try {
    localStorage.setItem('homesense_github_repo', url.trim());
  } catch {}
};

export const openGitHubRepo = (customUrl?: string): string => {
  const targetUrl = customUrl || getGitHubRepoUrl();
  try {
    // Standard window open with security rel attributes
    const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.assign(targetUrl);
    }
  } catch {
    window.location.assign(targetUrl);
  }
  return targetUrl;
};
