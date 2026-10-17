import { photoAtWidth } from './photoUrl';

describe('photoAtWidth', () => {
  const base =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/T.jpg';

  it('asks Wikimedia for a smaller standard thumbnail', () => {
    expect(photoAtWidth(`${base}/1280px-T.jpg?x=1`, 960)).toBe(
      `${base}/960px-T.jpg?x=1`,
    );
  });

  it('never asks for a bigger one, and leaves other photos alone', () => {
    expect(photoAtWidth(`${base}/330px-T.jpg`, 500)).toBe(
      `${base}/330px-T.jpg`,
    );
    expect(photoAtWidth('https://example.com/a.jpg', 250)).toBe(
      'https://example.com/a.jpg',
    );
  });
});
