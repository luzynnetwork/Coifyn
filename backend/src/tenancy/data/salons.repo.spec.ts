import { slugify } from './salons.repo.js';

describe('slugify', () => {
  it('lowercases, hyphenates and appends a short suffix', () => {
    const slug = slugify('Fade Room');
    expect(slug).toMatch(/^fade-room-[0-9a-f]{6}$/);
  });

  it('strips punctuation and collapses separators', () => {
    expect(slugify("Ali's  Barber & Co.")).toMatch(/^ali-s-barber-co-[0-9a-f]{6}$/);
  });

  it('falls back to "salon" for an empty-ish name', () => {
    expect(slugify('!!!')).toMatch(/^salon-[0-9a-f]{6}$/);
  });

  it('produces different slugs for the same name', () => {
    expect(slugify('Fade Room')).not.toEqual(slugify('Fade Room'));
  });
});
