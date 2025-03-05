---
"template-files": minor
---

Add "add-additional-lines" logic. But be careful: DO NOT use it on any files where inline contents will change (e.g. the change a folder in a path) because then the "comm" command wrongly interprets the output. Reference: https://chatgpt.com/share/67c8ae80-aa18-800b-9b88-a62393ddbe08
