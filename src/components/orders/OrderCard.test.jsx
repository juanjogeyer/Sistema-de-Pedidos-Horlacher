import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderCard } from './OrderCard';

const order = {
  id: 'a1',
  name: 'Kiosco Luna',
  billing: '9 + IVA',
  express: 'TransFer',
  date: '2026-08-07T13:45:00Z',
  printed: false,
  seller_id: 'eduardo',
  cart: [
    { code: '0007', name: 'Bolita crocante 7 x 1 kg', quantity: 3 },
    { code: '0025', name: 'Tutuca 10 x 1 kg', quantity: 2 },
  ],
};

describe('OrderCard', () => {
  it('muestra los datos del pedido', () => {
    render(<OrderCard order={order} />);

    expect(screen.getByText('Kiosco Luna')).toBeInTheDocument();
    expect(screen.getByText(/9 \+ IVA/)).toBeInTheDocument();
    expect(screen.getByText(/TransFer/)).toBeInTheDocument();
  });

  it('suma las cantidades del carrito', () => {
    render(<OrderCard order={order} />);

    expect(screen.getByText('5 ítems')).toBeInTheDocument();
  });

  it('lista cada producto con su cantidad', () => {
    render(<OrderCard order={order} />);

    expect(screen.getByText('Bolita crocante 7 x 1 kg')).toBeInTheDocument();
    expect(screen.getByText('Tutuca 10 x 1 kg')).toBeInTheDocument();
    expect(screen.getByText('3x')).toBeInTheDocument();
  });

  // Caso 11 del spec.
  it('no muestra el vendedor si no se lo pasan', () => {
    render(<OrderCard order={order} />);

    expect(screen.queryByText('Eduardo Horlacher')).not.toBeInTheDocument();
  });

  it('muestra el vendedor cuando se lo pasan', () => {
    render(<OrderCard order={order} seller="Eduardo Horlacher" />);

    expect(screen.getByText('Eduardo Horlacher')).toBeInTheDocument();
  });

  it('marca como Impreso solo los pedidos impresos', () => {
    const { rerender } = render(<OrderCard order={order} />);
    expect(screen.queryByText('Impreso')).not.toBeInTheDocument();

    rerender(<OrderCard order={{ ...order, printed: true }} />);
    expect(screen.getByText('Impreso')).toBeInTheDocument();
  });

  it('renderiza los botones que le pasen', () => {
    render(<OrderCard order={order} actions={<button>Cancelar</button>} />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('sin botones no dibuja la barra de acciones', () => {
    render(<OrderCard order={order} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
