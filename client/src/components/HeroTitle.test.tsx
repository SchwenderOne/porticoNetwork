import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroTitle from './HeroTitle';

describe('HeroTitle Komponente', () => {
  it('zeigt Titel und Untertitel korrekt an', () => {
    render(<HeroTitle title="Test-Titel" subtitle="Test-Untertitel" />);
    // Überschrift (h1) prüfen
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test-Titel');
    // Untertitel prüfen
    expect(screen.getByText('Test-Untertitel')).toBeInTheDocument();
  });
}); 