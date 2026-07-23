// Stamp the service-worker cache version per build so every deploy busts old caches.
import { readFileSync, writeFileSync } from "node:fs";
const p = new URL("../public/sw.js", import.meta.url);
let s = readFileSync(p, "utf8");
s = s.replace(/const V = "hy-[^"]*"/, `const V = "hy-${Date.now()}"`);
writeFileSync(p, s);
console.log("sw.js cache version stamped");
