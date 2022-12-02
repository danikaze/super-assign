# super-assign

Vitaminized object assignation with customizable options and inferred types.

## Installation

via npm:

```
npm install super-assign
```

via yarn:

```
yarn add super-assign
```

## Usage

It's used in the same way as [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) but it comes with support for object deep extension by default:

```ts
import { assign } from `super-assign`;

const object = {
  n: 123,
  s: 'foobar',
  o: {
    a: 1,
    b: 2,
  },
};
const updates = {
  hoge: 'hoge',
  o: {
    a: 0,
    c: 3,
  }
};

assign(object, updates);
// object → {
//   n: 123,
//   s: 'foobar',
//   hoge: 'hoge',
//   o: {
//     a: 0,
//     b: 2,
//     c: 3,
//   },
// }
```

Like [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign), every argument gets assigned and modify the first argument, which acts as the target:

```ts
import { assign } from `super-assign`;

const res = assign(target, source1, source2, ..., sourceN);
// res === target
```

### Pure assignment

To avoid modifying the target, `assignCopy` is available also as a pure function:

```ts
import { assignCopy } from `super-assign`;

const newObject = assignCopy(obj1, obj2, obj3);
// newObject !== obj1
```

### Field deletion

Sometimes it can be useful to delete fields when updating an object. While this could be achieved by assigning `undefined` or `null` values, there's an option to natively delete the desired fields.

By default there's a special value provided by the library to achieve this:

```ts
import { assign, ASSIGN_DELETE } from 'super-assign';

const object = {
  n: 123,
  s: 'string',
  o: {
    a: 1,
    b: 2,
    c: 3,
  },
};
assign(object, {
  // update object.s value
  s: 'updated',
  o: {
    // update object.o.a value
    a: 0,
    // delete object.o.b from origin
    b: ASSIGN_DELETE,
    // add new object.o.d field
    d: 4,
  },
});
// object → {
//   n: 123,
//   s: 'updated',
//   o: {
//     a: 0,
//     c: 3,
//     d: 4,
//   }
// }
```

> Note: `ASSIGN_DELETE` is a [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) to ensure a unique value and due to this it cannot be serialized (i.e. for http requests).

A custom value can provided to fit the cases where serialization is needed (_see [Customization](#customization)_).

```ts
import { getCustomAssign } from 'super-assign';

// `__DEL__` will be used now to delete fields
const DELETE = '__DEL__';
const assign = getCustomAssign({ deleteValue: DELETE });
assign({ a: 1, b: 2, c: 3 }, { b: DELETE });
// → { a:1, c:3 }
```

### Usage notes

While `objects` can be extended, `functions`, `Symbols` and `DOM elements` will just be referenced so any modification to a field of these types in the extended object will affect as well as the values in the sources.

Arrays will be shallow copied (array modifications won't affect the source, but any array element will just be references)

```ts
const base = {};
const src = {
  n: 123,
  str: 'string',
  obj: { a: 1, b: 2 },
  arr: [{}, {}, {}],
  fn: () => {},
  dom: document.createElement('div'),
  sym: Symbol(),
};
const res = assign(base, src);
// base.n !== src.n
// base.str !== src.str
// base.obj !== src.obj
// base.arr !== src.arr
// base.arr[i] === src.arr[i]
// base.fn === src.fn
// base.dom === src.dom
// base.sym === src.sym
```

## Customization

New _assigners_ can be created with custom behavior via the `getCustomAssign` function:

```ts
import { getCustomAssign } from 'super-assign';

const customAssign = getCustomAssign({
  shallow: true,
  returnCopy: true,
});
```

Note that every time you call `getCustomAssign` a new function will be created. If the same function is going to be reused in several places it's recommended to memoize/store+share it.

```ts
/*
 * utils/assign.ts
 */
import { getCustomAssign } from 'super-assign';

export const myAssign = getCustomAssign({
  shallow: false,
  returnCopy: true,
  ignoreValues: [undefined, null],
});

/*
 * Usage from any/other/file.ts
 */
import { myAssign } from 'utils/assign';

const res = myAssign(obj1, obj2);
```

For those cases where a custom assignment is just required once, there's also available the `assignWithOptions` function, which works in the same way but accepts the customizable options as the first parameter and doesn't create any new function:

```ts
import { AssignOptions, assignWithOptions } from 'super-assign';

const options: AssignOptions = {
  returnCopy: true,
  shallow: true,
};
const res = assignWithOptions(options, src1, src2);
```

### Customizable options

The list of customizable options are:

| Option       | Default         | Description                                                                                                                                                      |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ignoreValues | `[undefined]`   | List of values to ignore. By default `undefined` values will not be assigned but `null` values will                                                              |
| ignoreKeys   | `undefined`     | List of keys to ignore. None by default                                                                                                                          |
| deleteValue  | `ASSIGN_DELETE` | If defined, when a key has this value, the key will be deleted from the target object. Note that this is `undefined` the field deletion feature will be disabled |
| returnCopy   | `false`         | If `true` the target object will not be modified                                                                                                                 |
| shallow      | `false`         | If `true` there will be no deep assignment for objects                                                                                                           |
