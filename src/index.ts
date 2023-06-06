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

// nasty definition of Assign accepting from 1..10 parameters (apart from the Target)
// but makes type resolution much faster, and sincerely, if you need to assign more
// than 10 objects, you can do it in 2 steps
type Assign = <
  T extends Record<string, any>,
  O1 extends Record<string, any>,
  O2 extends Record<string, any>,
  O3 extends Record<string, any>,
  O4 extends Record<string, any>,
  O5 extends Record<string, any>,
  O6 extends Record<string, any>,
  O7 extends Record<string, any>,
  O8 extends Record<string, any>,
  O9 extends Record<string, any>,
  O10 extends Record<string, any>
>(
  target: T,
  o1?: O1 | null,
  o2?: O2 | null,
  o3?: O3 | null,
  o4?: O4 | null,
  o5?: O5 | null,
  o6?: O6 | null,
  o7?: O7 | null,
  o8?: O8 | null,
  o9?: O9 | null,
  o10?: O10 | null
) => Extend<
  T,
  Extend<
    O1,
    Extend<
      O2,
      Extend<
        O3,
        Extend<
          O4,
          Extend<O5, Extend<O6, Extend<O7, Extend<O8, Extend<O9, O10>>>>>
        >
      >
    >
  >
>;

type Extend<A extends Record<string, any>, B extends Record<string, any>> = {
  [key in keyof A | keyof B]: key extends keyof B
    ? B[key]
    : key extends keyof A
    ? A[key]
    : never;
};

const checkDom = typeof Element !== 'undefined';

export function assignWithOptions<T extends Record<string, any>>(
  options: AssignOptions,
  ...sources: (T | any)[]
): T {
  const { ignoreValues, ignoreKeys, deleteValue, returnCopy, shallow } =
    options;
  const target = (returnCopy ? {} : sources[0]) as T;

  for (let i = returnCopy ? 0 : 1; i < sources.length; i++) {
    const source = sources[i];

    // ignore null/undefined source objects
    if (source == undefined) {
      continue;
    }

    // extend the target
    const keys = Object.keys(source) as (keyof T)[];
    for (const key of keys) {
      if (ignoreKeys?.includes(key)) continue;

      const value = source[key];

      if (value === target || ignoreValues?.includes(value)) {
        continue;
      }

      if (deleteValue !== undefined && deleteValue === value) {
        delete target[key];
        continue;
      }

      if (Array.isArray(value)) {
        target[key] = value.slice() as T[keyof T];
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

      if (shouldShallowAssign) {
        target[key] = value;
      } else {
        // {} needs to be assigned first, in case it doesn't exist
        if (target[key] === undefined) {
          target[key] = {} as T[keyof T];
        }
        target[key] = assignWithOptions(
          options,
          target![key] as {},
          value
        ) as T[keyof T];
      }
    }
  }

  return target as T;
}
