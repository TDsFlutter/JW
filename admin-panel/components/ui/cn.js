// Tiny classNames joiner — flattens, drops falsy, joins with spaces.
export function cn(...args) {
  return args.flat(Infinity).filter(Boolean).join(" ");
}
