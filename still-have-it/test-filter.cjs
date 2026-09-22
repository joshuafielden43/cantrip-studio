global.window = {};
require("./vendor/shi-filter.js");

for (const text of ["s h i t", "f.u.c.k", "c-u-n-t"]) {
  if (window.SHIFilter.checkInvitation(text).ok) throw new Error(`accepted: ${text}`);
}
for (const text of ["finish it", "hello"]) {
  if (!window.SHIFilter.checkInvitation(text).ok) throw new Error(`blocked: ${text}`);
}
