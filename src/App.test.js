import { render, screen } from '@testing-library/react';

jest.mock('./BuilderTimeline.jsx', () => () => null);

import App from './App';

test('renders smart village tracker title', () => {
    render(<App />);
    const headingElement = screen.getByText(/coc upgrade tracker/i);
    expect(headingElement).toBeInTheDocument();
});

test('renders phase controls for strategy and reset actions', () => {
    render(<App />);

    expect(screen.getByText(/schedule generator/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /lpt/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /spt/i }).length).toBeGreaterThan(0);
    expect(
        screen.getByRole('button', { name: /reset settings/i }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('button', { name: /reset progress/i }),
    ).toBeInTheDocument();
});
