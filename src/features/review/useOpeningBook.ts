import { useEffect, useState } from 'react';
import { bookIfLoaded, loadBook, type OpeningBook } from '../../lib/book';

/** The opening book (null until its lazy chunk has loaded). */
export function useOpeningBook(): OpeningBook | null {
  const [book, setBook] = useState(bookIfLoaded);
  useEffect(() => {
    if (book) return;
    let alive = true;
    loadBook()
      .then((b) => alive && setBook(b))
      .catch((e) => console.warn('Opening book failed to load', e));
    return () => {
      alive = false;
    };
  }, [book]);
  return book;
}
