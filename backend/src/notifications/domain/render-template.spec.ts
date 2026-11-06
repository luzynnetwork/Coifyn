import { describe, expect, it } from 'vitest';
import { renderTemplate } from './render-template.js';

describe('renderTemplate', () => {
  it('substitutes variables', () => {
    expect(renderTemplate('Hi {{name}}, {{n}} min', { name: 'Sam', n: 20 })).toBe(
      'Hi Sam, 20 min',
    );
  });

  it('renders a missing variable as empty, never as the raw placeholder', () => {
    expect(renderTemplate('Hi {{name}}!', {})).toBe('Hi !');
  });

  it('tolerates spaces inside the braces', () => {
    expect(renderTemplate('{{ a }}', { a: 'x' })).toBe('x');
  });
});
