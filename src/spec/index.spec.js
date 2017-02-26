import { sanitizeImageSrc, setHost, splitPinnedPages } from '../util';

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
    function convertImageSrcSet(baseUrl, imageSrcSet) {
      return imageSrcSet.split(',').map(src => baseUrl + '/image' + src).join(',');
    }
    expect(convertImageSrcSet('', input)).toEqual(output);
  });
  it('should split PINNED_PAGES', () => {
    expect(splitPinnedPages('123,456')).toEqual(['123', '456']);
    expect(splitPinnedPages('123')).toEqual(['123']);
    expect(splitPinnedPages('')).toEqual([]);
    expect(splitPinnedPages()).toEqual([]);
  });
});
