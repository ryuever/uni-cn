/**
 * Minimal stub for @vue/compiler-core - used by @vuedx/template-ast-types
 * We stub vue-metamorph so transform is never called; these are for type/code that gets tree-shaken
 */
export function createSimpleExpression(_content: string, _isStatic?: boolean) {
  return {} as any;
}
export const createCompoundExpression = () => ({});
export const createCallExpression = () => ({});
export const createArrayExpression = () => ({});
export const createObjectExpression = () => ({});
export const createFunctionExpression = () => ({});
export const createConditionalExpression = () => ({});
export const createCacheExpression = () => ({});
export const createBlockStatement = () => ({});
export const createReturnStatement = () => ({});
export const createIfStatement = () => ({});
export const createAssignmentExpression = () => ({});
export const createSequenceExpression = () => ({});
export const createVNodeCall = () => ({});
export const createElementVNode = () => ({});
export const createCommentVNode = () => ({});
export const createTextVNode = () => ({});
export const createStaticVNode = () => ({});
export const createForLoopParams = () => ([]);
export const createChildren = () => ({});
export const processExpression = () => ({});
export const processSlotOutlet = () => ({});
export const processElement = () => ({});
export const processComponent = () => ({});
export const transformElement = () => ({});
export const transformSlotOutlet = () => ({});
export const buildProps = () => ({});
export const buildSlots = () => ({});
export const getBaseTransformPreset = () => ([]);
export const DOMNamespaces = {};
export const helperNameMap = {};
export const NodeTypes = {};
export const ElementTypes = {};
export const ConstantTypes = {};
export const locStub = {};
export const ErrorCodes = {};
export const defaultOnError = () => {};
export const defaultOnWarn = () => {};
export const isSimpleIdentifier = () => false;
export const isStaticExp = () => false;
export const advancePositionWithMutation = () => {};
export const advancePositionWithClone = () => ({});
export const getInnerRange = () => ({});
export const findDir = () => undefined;
export const findProp = () => undefined;
export const hasDynamicKeyVBind = () => false;
export const isStaticArgOf = () => false;
export const isTemplateNode = () => false;
export const isVSlot = () => false;
export const isSlotOutlet = () => false;
export const getVNodeBlockHelper = () => '';
export const getVNodeHelper = () => '';
export const getMemoedVNodeCall = () => ({});
export const injectProp = () => ({});
export const toValidAssetId = () => '';
export const makeBlock = () => ({});
export const createRoot = () => ({});
export const createCompilerError = () => ({} as any);
export const createStructuralDirectiveTransform = () => ({} as any);
export const noopDirectiveTransform = () => ({} as any);
export const registerRuntimeHelpers = () => {};
export const createObjectProperty = () => ({});
export const createInterpolation = () => ({});
