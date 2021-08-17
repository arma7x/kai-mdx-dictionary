require.config({
  // waitSeconds: 0,
  baseUrl: '/js/mdict-lib',
  waitSeconds: 0,

  paths: {
    'jquery'        : 'jquery-1.11.3.min',
    'pako'          : 'pako_inflate.min',
    'lzo'           : 'minilzo-decompress.min',
    'bluebird'      : 'bluebird.min',
    'selectize'     : 'selectize.min',
    'bitstring'     : 'bitstring.min',
    'murmurhash3'   : 'murmurhash3.min',
    'ripemd128'     : 'ripemd128.min',
    'mdict-commo'   : 'mdict-common',
    'mdict-parser'  : 'mdict-parser',
    'mdict-renderer': 'mdict-renderer',
  },
  map: {
    '*': {}
  },
  shim: {}
});

define('mdict-parseXml', function() {
  return function (str) {
        return (new DOMParser()).parseFromString(str, 'text/xml');
    }
});
