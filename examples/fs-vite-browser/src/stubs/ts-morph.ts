/**
 * Stub for ts-morph - Node-only TS compiler API. init with skipAddComponents never uses it.
 */
export const SyntaxKind = {} as any;
export const ScriptKind = { TS: 1, JS: 2 } as any;
export const QuoteKind = { Single: 0, Double: 1 } as any;

export class Project {
  constructor(_opts?: unknown) {}
  createSourceFile() {
    return {} as any;
  }
}

export type ObjectLiteralExpression = any;
export type ArrayLiteralExpression = any;
export type PropertyAssignment = any;
export type VariableStatement = any;
