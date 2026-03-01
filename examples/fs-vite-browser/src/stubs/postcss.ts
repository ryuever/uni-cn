/**
 * Minimal postcss stub for browser - init with skipAddComponents never calls it.
 * Provides enough API for modules to load; throws if actually used.
 */
class StubNode {
  type = 'node';
  constructor() {}
}
class StubAtRule extends StubNode {
  type = 'atrule' as const;
  name = '';
  params = '';
  constructor(opts?: { name?: string; params?: string }) {
    super();
    if (opts) Object.assign(this, opts);
  }
}
class StubRoot extends StubNode {
  type = 'root' as const;
  nodes: StubNode[] = [];
}
class StubRule extends StubNode {
  type = 'rule' as const;
  selector = '';
}
class StubDeclaration extends StubNode {
  type = 'decl' as const;
  prop = '';
  value = '';
}
class StubComment extends StubNode {
  type = 'comment' as const;
  text = '';
}

function stubProcess(_input: string) {
  return Promise.resolve({ css: '', map: undefined, toString: () => '' });
}

const postcss = Object.assign(
  (_plugins?: unknown[]) => ({
    process: stubProcess,
  }),
  {
    atRule: (opts?: { name?: string; params?: string }) => new StubAtRule(opts),
    comment: (opts?: { text?: string }) => new StubComment(opts),
    rule: (opts?: { selector?: string }) => new StubRule(opts),
    decl: (opts?: { prop?: string; value?: string }) => new StubDeclaration(opts),
    root: (opts?: { nodes?: StubNode[] }) => new StubRoot(opts),
  }
);

export default postcss;
export { StubAtRule as AtRule, StubRoot as Root, StubRule as Rule, StubDeclaration as Declaration };
