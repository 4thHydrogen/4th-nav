import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  expect(screen.getByText('页面出现错误')).toBeInTheDocument();
});
