# LogicLab — From Boolean Expression to Logic Circuit.
`npm install` · `npm run dev` · `npm test` · `npm run build`
**Implemented:** tokenizer + recursive-descent parser (no eval), AST, evaluator, truth table with intermediate columns (max 10 vars), circuit graph + SVG renderer (SVG/PNG export, zoom, live input toggling), graph-vs-AST verification, adaptive construction procedure, Quine–McCluskey minimizer with equivalence check, CSV export.
**New UI:** glassmorphism design, operator toolbar, recent expressions, share link, truth-table filter, canonical Σm/ΠM, tap-to-edit K-map.
**Added:** Logic Gates Library, drag-and-drop Circuit Simulator (custom SVG canvas, autosave, JSON/SVG/PNG, expression + truth table), Number System Converter (bases 2–36, BCD, Excess-3, Gray, 1's/2's complement, working steps), practical documentation export (HTML/PDF via print, Markdown; apparatus table with TTL IC counts).
**Not yet built:** gates library, drag-and-drop simulator (React Flow), saved projects, practical-documentation export, Tailwind/shadcn, don't-cares, algebraic derivations.
Variables are single letters; adjacent letters mean AND. NAND/NOR/XNOR cannot be chained without parentheses. Cover selection = essential primes + greedy (not guaranteed globally minimal).
