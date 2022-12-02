export interface AssignOptions {
  /** List of values to ignore  */
  ignoreValues?: any[];
  /** List of keys to ignore */
  ignoreKeys?: any[];
  /** Value used to delete object keys  */
  deleteValue?: any;
  /**
   * When `true`, the returned value will be a new object
   * and the target(first argument) will not be modified
   */
  returnCopy: boolean;
  /** When `true` no deep assignments will be done */
  shallow: boolean;
}

export const ASSIGN_DELETE = Symbol('ASSIGN_DELETE');

export const ASSIGN_DEFAULT_OPTIONS: AssignOptions = {
  ignoreValues: [undefined],
  deleteValue: ASSIGN_DELETE,
  returnCopy: false,
  shallow: false,
};

export function getCustomAssign(options: Partial<AssignOptions> = {}): Assign {
  return assignWithOptions.bind(undefined, {
    ...ASSIGN_DEFAULT_OPTIONS,
    ...options,
  }) as unknown as Assign;
}

export const assign = getCustomAssign() as Assign;

export const assignCopy = getCustomAssign({ returnCopy: true }) as Assign;

type Assign = <T extends {}, U extends any[]>(
  target: T,
  ...args: U
) => Assigned<T, U>;

type Assigned<T, U extends any[]> = {
  0: T;
  1: ((...t: U) => any) extends (head: infer Head, ...tail: infer Tail) => any
    ? Assigned<Omit<T, keyof Head> & Head, Tail>
    : never;
}[U['length'] extends 0 ? 0 : 1];

const checkDom = typeof Element !== 'undefined';

export function assignWithOptions<T extends {}>(
  options: AssignOptions,
  ...sources: (T | any)[]
): T {
  const { ignoreValues, ignoreKeys, deleteValue, returnCopy, shallow } =
    options;
  const target = returnCopy ? {} : (sources[0] as T);

  for (let i = returnCopy ? 0 : 1; i < sources.length; i++) {
    const source = sources[i];

    // ignore null/undefined source objects
    if (source == undefined) {
      continue;
    }

    // extend the target
    const keys = Object.keys(source);
    for (const key of keys) {
      if (ignoreKeys?.includes(key)) continue;

      const value = source[key as keyof T];

      if (value === target || ignoreValues?.includes(value)) {
        continue;
      }

      if (deleteValue !== undefined && deleteValue === value) {
        delete (target as T)[key as keyof T];
        continue;
      }

      if (Array.isArray(value)) {
        (target as T)[key as keyof T] = value.slice() as T[keyof T];
        continue;
      }

      const shouldShallowAssign =
        shallow ||
        // functions are always referenced
        typeof value === 'function' ||
        // DOM elements are always referenced
        (checkDom && value instanceof Element) ||
        // null values are not objects
        value === null ||
        typeof value !== 'object';
      (target as T)[key as keyof T] = (
        shouldShallowAssign
          ? value
          : assignWithOptions(
              options,
              (target as T)![key as keyof T] as {},
              value
            )
      ) as T[keyof T];
    }
  }

  return target as T;
}
