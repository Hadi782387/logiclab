# LogicLab — From Boolean Expression to Logic Circuit.
`npm install` · `npm run dev` · `npm test` · `npm run build`
**Implemented:** tokenizer + recursive-descent parser (no eval), AST, evaluator, truth table with intermediate columns (max 10 vars), circuit graph + SVG renderer (SVG/PNG export, zoom, live input toggling), graph-vs-AST verification, adaptive construction procedure, Quine–McCluskey minimizer with equivalence check, CSV export.
**Not yet built:** gates library, drag-and-drop simulator (React Flow), saved projects, practical-documentation export, Tailwind/shadcn, don't-cares, algebraic derivations.
Variables are single letters; adjacent letters mean AND. NAND/NOR/XNOR cannot be chained without parentheses. Cover selection = essential primes + greedy (not guaranteed globally minimal).
