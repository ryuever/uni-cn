import { addDependencies } from '../store';
import type { DecoratorTarget, ModuleIdentifier } from '../types';

export function inject<T>(moduleIdentifier: ModuleIdentifier) {
  return (
    target: DecoratorTarget<T>,
    propertyName: string | undefined,
    index: number | undefined
  ) => {
    addDependencies(target, moduleIdentifier, propertyName!, index);
  };
}
