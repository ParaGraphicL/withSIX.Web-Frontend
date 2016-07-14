// Convert GUID string to Base-64 in Javascript
// by Mark Seecof, 2012-03-31

// GUID string with four dashes is always MSB first,
// but base-64 GUID's vary by target-system endian-ness.
// Little-endian systems are far more common.  Set le==true
// when target system is little-endian (e.g., x86 machine).
//
export const guidToBase64 = (g, le) => {
  var s = g.replace(/[^0-9a-f]/ig, '').toLowerCase();
  if (s.length != 32) return '';
  if (le)
    s = s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2) +
      s.slice(10, 12) + s.slice(8, 10) +
      s.slice(14, 16) + s.slice(12, 14) +
      s.slice(16);
  s += '0';

  var a, p, q;
  var r = '';
  var i = 0;
  while (i < 33) {
    a = (hexList.indexOf(s.charAt(i++)) << 8) |
      (hexList.indexOf(s.charAt(i++)) << 4) |
      (hexList.indexOf(s.charAt(i++)));

    p = a >> 6;
    q = a & 63;

    r += b64List.charAt(p) + b64List.charAt(q);
  }
  r += '==';

  return r;
} // guid_to_base64()

export const base64ToGuid = (g, le) => {
  var UUIDjs: any = require('uuid-js');
  var s = UUIDjs.fromBinary(atob(g)).toString();
  if (le) {
    s = s.replace(/[^0-9a-f]/ig, '').toLowerCase();
    s = s.slice(6, 8) + s.slice(4, 6) + s.slice(2, 4) + s.slice(0, 2) + "-" +
      s.slice(10, 12) + s.slice(8, 10) + "-" +
      s.slice(14, 16) + s.slice(12, 14) + "-" + s.slice(16, 20) + "-" + s.slice(20);
  }
  return s;
}

export const base64ToShort(base64) => base64.substring(0, 22).replace(/\//g, "_").replace(/\+/g, "-");
export const shortToBase64(shortBase64) => shortBase64.substring(0, 22).replace(/_/g, "/").replace(/\-/g, "+") + "==";
