import { convertImageSrcSet, sanitizeImageSrc, setHost, splitPinnedPages, parseParams } from '../util';
import { fragment, unsetBlackOrWhiteFont } from '../plugin';

function html(inner) {
  return { body: '<html><head></head><body>' + inner + '</body></html>' };
}

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
  describe('fragments', () => {
    it('should convert ⏎ in the <li>', () => {
      const body = '<ul><li>first⏎</li><li>second⏎</li><li>third⏎</li></ul>';
      expect(fragment({ body })).toEqual(html(
        '<ul><li class="fragment">first</li><li class="fragment">second</li><li class="fragment">third</li></ul>'
      ));
    });
    it('should convert ⏎ in the <p>', () => {
      const body = '<p>first⏎</p><p>second⏎</p><p>third⏎</p>';
      expect(fragment({ body })).toEqual(html(
        '<p class="fragment">first</p><p class="fragment">second</p><p class="fragment">third</p>'
      ));
    });
    it('should convert ⏎ with around an image', () => {
      const body = `<p><span class="confluence-embedded-file-wrapper confluence-embedded-manual-size"><img class="confluence-embedded-image confluence-external-resource" height="250" src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82" data-image-src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82"></span>&#x23CE;</p>`;
      expect(fragment({ body })).toEqual(html(
        `<p><span class="confluence-embedded-file-wrapper confluence-embedded-manual-size fragment"><img class="confluence-embedded-image confluence-external-resource" height="250" src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82" data-image-src="http://cfile25.uf.tistory.com/image/23028948558D5D6844CB82"></span></p>`
      ));
    });
    it('should split by <li>s', () => {
      const body = '<ul><li>A⏎</li><li>B⏎</li><li><strong>C with style</strong>, C as plain⏎</li></ul>';
      expect(fragment({ body })).toEqual(html(
        '<ul><li class="fragment">A</li><li class="fragment">B</li><li class="fragment"><strong>C with style</strong>, C as plain</li></ul>'
      ));
    });
    it('should convert nested <li>s', () => {
      const body = '<ul><li><strong>ha</strong>ha⏎<ul><li>he<strong>he</strong>⏎</li></ul></li></ul>';
      expect(fragment({ body })).toEqual(html(
        '<ul><li class="fragment"><strong>ha</strong>ha<ul><li class="fragment">he<strong>he</strong></li></ul></li></ul>'
      ));
    });
  });
});

describe('trouble shooting', () => {
  it('should clear format if the span colored with real black', () => {
    const body = '<span style="color: rgb(0,0,0);">abc</span>';
    expect(unsetBlackOrWhiteFont({ body })).toEqual(html('<span style="">abc</span>'));
  });
  it('should clear format if the span colored with real white', () => {
    const body = '<span style="color: rgb(255,255,255);">abc</span>';
    expect(unsetBlackOrWhiteFont({ body })).toEqual(html('<span style="">abc</span>'));
  });
  it('should not clear format if the span colored with real white or real black', () => {
    const body = '<span style="color: rgb(255,0,0);">abc</span>';
    expect(unsetBlackOrWhiteFont({ body })).toEqual(html('<span style="color: rgb(255,0,0);">abc</span>'));
  });
  it('should clear format if the span colored with real white having children', () => {
    const body = '<span style="color: rgb(255,255,255);">abc <a href="https://google.com">google</a></span>';
    expect(unsetBlackOrWhiteFont({ body })).toEqual(html('<span style="">abc <a href="https://google.com">google</a></span>'));
  });
});
