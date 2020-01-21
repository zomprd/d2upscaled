export const isMobileDevice = () => /(iphone|ipod|ipad|android)/gi.test(navigator.userAgent);

export const isPdfPrint = () => window.location.search.match(/print-pdf/gi);

/**
 * Resizes container to a fixed resolution
 */
export const resizeContainer = (container: HTMLElement, virtualWidth: number, virtualHeight: number) => {
  let scale: number;
  let isVertical = false;
  if (window.innerWidth / window.innerHeight > virtualWidth / virtualHeight) {
    scale = window.innerHeight / virtualHeight;
  } else {
    scale = window.innerWidth / virtualWidth;
    isVertical = true;
  }

  // On some mobile devices '100vh' is taller than the visible
  // viewport which leads to part of the presentation being
  let hideAddressBar = () => setTimeout(() => { window.scrollTo(0, 1); }, 10);

  if (isMobileDevice()) {
    document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
    // Events that should trigger the address bar to hide
    window.addEventListener('load', hideAddressBar, false);
    window.addEventListener('orientationchange', hideAddressBar, false);
  }

  let transform = `scale(${scale})`;
  let topPos = isVertical ? window.innerHeight / 2 - virtualHeight / 2 : ((scale - 1) * virtualHeight / 2);
  container.style.setProperty('position', 'absolute');
  container.style.setProperty('MozTransform', transform);
  container.style.setProperty('transform', transform);
  container.style.setProperty('WebkitTransform', transform);
  container.style.setProperty('top', topPos + 'px');
  container.style.setProperty('left', ((scale - 1) * virtualWidth / 2 + (window.innerWidth - virtualWidth * scale) / 2) + 'px');
};
