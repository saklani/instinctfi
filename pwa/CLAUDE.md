# Code Rules

- Keep it simple.
- If you are doing a lot of computation on the frontend, flag it — you are doing it wrong.
- Local overrides of `gap` and `padding` should be avoided.
- Fallback to primitives when possible. No `<div class="flex flex-row">` — use `Row` instead.
- Where can you use `div`? When a primitive is not defined — `Grid` is a good example.
- Prop drilling should be avoided. We use React Query, so always fetch data within the component presenting it.
- Avoid overriding text styles. Use `h1`, `h2`, `h3`, `p` directly.
- Avoid default HTML elements when a component-library version exists. `<button>` is almost never correct — use `Button`.
- Do we really need `useEffect`? Almost never. Most of what looks like an effect is derived state, an event handler, or a React Query side-effect — reach for those first.
