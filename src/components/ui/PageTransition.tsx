/**
 * Wraps a page's content so route changes get the native browser View
 * Transition API's fade+slide, driven by next-view-transitions (see
 * ViewTransitions in the root layout) rather than a bundled animation
 * library. The actual animation is plain CSS on the ::view-transition-*
 * pseudo-elements in globals.css — this component only marks where the
 * transitioned region starts. A <main> element it wraps keeps its own id
 * and className exactly as each page already sets them.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
