import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

describe('backend error messages', () => {
  it('preserves errors and plain backend error objects', () => {
    expect(getErrorMessage(new Error('Session expired'), 'Failed')).toBe('Session expired');
    expect(getErrorMessage({ message: 'Permission denied' }, 'Failed')).toBe('Permission denied');
  });

  it.each([null, undefined, 'raw rejection', { message: 42 }, { message: '   ' }])(
    'uses the fallback for an unstructured rejection: %j', error => {
      expect(getErrorMessage(error, 'Please try again')).toBe('Please try again');
    },
  );
});
