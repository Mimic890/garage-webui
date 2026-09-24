import { describe, expect, it } from 'vitest';
import { mergeOrder } from './dashboard-layout-store';

describe('mergeOrder', () => {
  it('keeps defaults when nothing is saved', () => {
    expect(mergeOrder(undefined, ['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });
  it('applies the saved order and drops unknown ids', () => {
    expect(mergeOrder(['c', 'x', 'a', 'b'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
  });
  it('slots new panels after their default predecessor', () => {
    expect(mergeOrder(['c', 'a'], ['a', 'b', 'c', 'd'])).toEqual(['c', 'd', 'a', 'b']);
    expect(mergeOrder(['b'], ['a', 'b'])).toEqual(['a', 'b']);
  });
});
