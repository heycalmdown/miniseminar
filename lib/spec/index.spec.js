const cheerio = require('cheerio');

const { convertImageSrcSet, sanitizeImageSrc, setHost, splitPinnedPages, parseParams } = require('../util');
const { fragment } = require('../plugin');

describe('miniseminar', () => {
  setHost('https://confluency.atlassian.net');

  it('should sanitize image-src to handle various confluence version', () => {
    const uri1 = 'https://confluency.atlassian.net/wiki/download/attachments/2097156/IMG_7444.jpg?version=1&modificationDate=1456043588519&cacheVersion=1&api=v2';
    expect(sanitizeImageSrc(uri1)).toEqual('/wiki/download/attachments/2097156/IMG_7444.jpg?version=1&modificationDate=1456043588519&cacheVersion=1&api=v2');

    const url2 = '/download/attachments/58065931/image2017-2-16%2016%3A28%3A32.png?version=1&modificationDate=1487230128000&api=v2';
    expect(sanitizeImageSrc(url2)).toEqual(url2);
  });
  it('should convert image-srcset', () => {
    const input = '/wiki/download/thumbnails/2097156/IMG_7444.jpg?width=550&height=500 2x,/wiki/download/thumbnails/2097156/IMG_7444.jpg?width=275&height=250 1x';
    const output = '/image/wiki/download/thumbnails/2097156/IMG_7444.jpg?width=550&height=500 2x,/image/wiki/download/thumbnails/2097156/IMG_7444.jpg?width=275&height=250 1x';

    expect(convertImageSrcSet('', input)).toEqual(output);
  });
  it('should split PINNED_PAGES', () => {
    expect(splitPinnedPages('123,456')).toEqual(['123', '456']);
    expect(splitPinnedPages('123')).toEqual(['123']);
    expect(splitPinnedPages('')).toEqual([]);
    expect(splitPinnedPages()).toEqual([]);
  });
  it('should parse params', () => {
    expect(parseParams('brush: js; gutter: false; theme: Confluence'))
      .toEqual({
        brush: 'js',
        gutter: 'false',
        theme: 'Confluence'
      });
  });
  it('should convert ⏎ in the <li>', () => {
    const a = '<ul><li>first⏎</li><li>second⏎</li><li>third⏎</li></ul>';
    expect(fragment(a))
      .toEqual(
        '<ul><li class="fragment">first</li><li class="fragment">second</li><li class="fragment">third</li></ul>'
      );
  });
  it('should convert ⏎ in the <p>', () => {
    const a = '<p>first⏎</p><p>second⏎</p><p>third⏎</p>';
    expect(fragment(a))
      .toEqual(
        '<p class="fragment">first</p><p class="fragment">second</p><p class="fragment">third</p>'
      );
  });
  it('should convert ⏎ with around an image', () => {
    expect(fragment(
        `<p><span class="confluence-embedded-file-wrapper confluence-embedded-manual-size"><img class="confluence-embedded-image confluence-external-resource" height="250" src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82" data-image-src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82"></span>&#x23CE;</p>`))
      .toEqual(
        `<p><span class="confluence-embedded-file-wrapper confluence-embedded-manual-size fragment"><img class="confluence-embedded-image confluence-external-resource" height="250" src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82" data-image-src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82"></span></p>`);
  });
});
