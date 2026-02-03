import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { smoothScrollToElement } from '@/lib/smoothScroll';

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash, smoothly scroll to that element
    if (hash) {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const elementId = hash.slice(1); // Remove '#' prefix
        smoothScrollToElement(elementId, 96); // 96px offset for fixed header
      }, 100);
    } else {
      // No hash - INSTANT scroll to top for page navigation
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;