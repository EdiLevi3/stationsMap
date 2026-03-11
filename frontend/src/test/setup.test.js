import { describe, it, expect } from 'vitest';

describe('Vitest setup', () => {
    it('should run tests successfully', () => {
        expect(true).toBe(true);
    });

    it('should have jest-dom matchers available', () => {
        const div = document.createElement('div');
        div.textContent = 'hello';
        document.body.appendChild(div);
        expect(div).toBeInTheDocument();
        document.body.removeChild(div);
    });
});
