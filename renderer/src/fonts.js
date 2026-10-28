import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

const FONTS_CSS =
  'https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;800&family=Frank+Ruhl+Libre:wght@500;700&family=Rubik+Mono+One&family=Rubik+Wet+Paint&display=block';

// טוען את פונטי המותג לפני שמתחילים לצלם פריימים
export function useBrandFonts() {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    if (!document.querySelector('link[data-brand-fonts]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONTS_CSS;
      link.dataset.brandFonts = '1';
      document.head.appendChild(link);
      link.onload = () => document.fonts.ready.then(() => continueRender(handle));
      link.onerror = () => continueRender(handle); // בלי רשת – ממשיכים עם פונט ברירת מחדל
    } else {
      continueRender(handle);
    }
  }, [handle]);
}
