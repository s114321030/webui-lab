let savedTheme = null;

try {
  savedTheme = localStorage.getItem('theme');
} catch {
  savedTheme = null;
}

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : systemPrefersDark ? 'dark' : 'light';

document.documentElement.dataset.theme = initialTheme;
