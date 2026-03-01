import { render, screen } from '@testing-library/react';

jest.mock('./BuilderTimeline.jsx', () => () => null);

import App from './App';

test('renders smart village tracker title', () => {
    render(<App />);
    const headingElement = screen.getByText(/smart village tracker/i);
    expect(headingElement).toBeInTheDocument();
});
