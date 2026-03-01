/** Stub for postcss/lib/at-rule - used by update-css-vars */
class StubAtRule {
  type = 'atrule' as const;
  name = '';
  params = '';
  nodes: unknown[] = [];
  constructor(_opts?: unknown) {}
}
export default StubAtRule;
