import 'jest';
import { assign, assignCopy, ASSIGN_DELETE, getCustomAssign } from '@src';

describe('Default assign()', () => {
  it('should do nothing if there are no values', () => {
    const base = { a: 1 };
    expect(assign(base)).toEqual(base);
    expect(assign(base, null)).toEqual(base);
    expect(assign(base, undefined)).toEqual(base);
  });

  it('should extend and modify the target object but not the sources', () => {
    /*
     * Defining `base`, `source#` as const is just to check
     * that the resulting `typeof res` is properly calculated
     */
    const base = {
      num: 1,
      arr: [1, 2, 3],
      obj: {
        foo: 'foo',
        bar: 'bar',
        deep: { v: 'hoge' },
      },
    } as const;
    const source1 = { num: 2, foobar: 'hoge' } as const;
    const source2 = { num: 3 } as const;
    const source3 = {
      obj: { val: 'newval', foo: 'foo2', deep: { v2: 12345 } },
    } as const;
    const source4 = {
      // fn: () => {},
      dom: document.createElement('div'),
    } as const;
    const source5 = {
      // this tests that assignments to unexisting fields are ok
      // (fix in 1.0.2)
      newField: { with: ['deep', 'fields'] },
    } as const;

    const res = assign(base, source1, source2, source3, source4, source5);
    expect(res).toBe(base);
    expect(res).toEqual(base);
    expect(res).toEqual({
      num: 3,
      arr: [1, 2, 3],
      obj: {
        foo: 'foo2',
        bar: 'bar',
        deep: { v: 'hoge', v2: 12345 },
        val: 'newval',
      },
      foobar: 'hoge',
      // fn: () => {},
      dom: document.createElement('div'),
      newField: { with: ['deep', 'fields'] },
    });
    expect(source1).toEqual({ num: 2, foobar: 'hoge' });
    expect(source2).toEqual({ num: 3 });
  });

  it('should shallow copy arrays', () => {
    const base = { n: 123 };
    const src = { s: 'foobar', arr: ['a', {}, 0] };
    const res = assign(base, src);

    expect(res).toEqual({ n: 123, s: 'foobar', arr: ['a', {}, 0] });
    expect(res.arr).not.toBe(src.arr);
    expect(res.arr[0]).toBe(src.arr[0]);
    expect(res.arr[1]).toBe(src.arr[1]);
    expect(res.arr[2]).toBe(src.arr[2]);
  });

  it('should just reference functions', () => {
    const base = { n: 123 };
    const src = { s: 'foobar', fn: () => {} };
    const res = assign(base, src);
    const { fn, ...obj } = res;

    expect(obj).toEqual({ n: 123, s: 'foobar' });
    expect(fn).toBe(src.fn);
  });

  it('should just reference DOM elements', () => {
    const base = { n: 123 };
    const src = { s: 'foobar', dom: document.createElement('div') };
    const res = assign(base, src);
    const { dom, ...obj } = res;

    expect(obj).toEqual({ n: 123, s: 'foobar' });
    expect(dom).toBe(src.dom);
  });

  it('should just reference Symbols', () => {
    const base = { n: 123 };
    const src = { s: 'foobar', sym: Symbol('xyz') };
    const res = assign(base, src);
    const { sym, ...obj } = res;

    expect(obj).toEqual({ n: 123, s: 'foobar' });
    expect(sym).toBe(src.sym);
  });

  it('should not modify the target object when the copy option is specified', () => {
    const base = { num: 1 };
    const res = assignCopy(base, { str: 'foobar' });

    expect(res).not.toBe(base);
    expect(base).toEqual({ num: 1 });
    expect(res).toEqual({ num: 1, str: 'foobar' });
  });

  it('should ignore specified keys', () => {
    const customAssign = getCustomAssign({ ignoreKeys: ['ignore'] });
    const res = customAssign({ base: 1 }, { n: 2, ignore: 3, nil: null });
    expect(res).toEqual({ base: 1, n: 2, nil: null });
  });

  it('should ignore specified values', () => {
    const customAssign = getCustomAssign({ ignoreValues: [undefined, null] });
    const res1 = customAssign({ base: 1 }, { n: 2, a: null, b: undefined });
    expect(res1).toEqual({ base: 1, n: 2 });

    // no ignored values
    const noIgnoreAssign = getCustomAssign({ ignoreValues: undefined });
    const res2 = noIgnoreAssign({ base: 1 }, { n: 2, a: null, b: undefined });
    expect(res2).toEqual({ base: 1, n: 2, a: null, b: undefined });
  });

  it('should apply deletion member if enabled', () => {
    // default delete value
    const res1 = assign(
      { base: 1, del: 2, o: { a: 1, b: 2, c: 3 } },
      { val: 3, del: ASSIGN_DELETE, o: { a: 0, b: ASSIGN_DELETE } }
    );
    expect(res1).toEqual({ base: 1, val: 3, o: { a: 0, c: 3 } });

    // custom delete value
    const customAssign = getCustomAssign({ deleteValue: null });
    const res2 = customAssign({ base: 1, del: 2 }, { val: 3, del: null });
    expect(res2).toEqual({ base: 1, val: 3 });

    // no delete value
    const noDeleteAssign = getCustomAssign({ deleteValue: undefined });
    const res3 = noDeleteAssign({ base: 1, del: 2 }, { val: 3, del: null });
    expect(res3).toEqual({ base: 1, val: 3, del: null });
  });

  it('should accept shallow assign', () => {
    const shallowAssign = getCustomAssign({ shallow: true });
    const base = { a: 1, o: { b: 2, c: 3 } };
    const src = { s: 'x', o: { d: 4 } };
    const res = shallowAssign(base, src);

    expect(res).toBe(base);
    expect(res).toEqual({ a: 1, s: 'x', o: { d: 4 } });
    expect(src).toEqual({ s: 'x', o: { d: 4 } });
  });
});

Object.assign({});
