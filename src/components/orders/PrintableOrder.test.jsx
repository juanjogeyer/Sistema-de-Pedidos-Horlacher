import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrintableOrder } from './PrintableOrder';

const order = {
  id: 'a1',
  name: 'Kiosco Luna',
  billing: '9 + IVA',
  express: 'TransFer',
  notes: 'Entregar por la mañana',
  date: '2026-08-07T13:45:00Z',
  seller_id: 'eduardo',
  cart: [
    { code: '0007', name: 'Bolita crocante 7 x 1 kg', quantity: 3 },
    { code: '0025', name: 'Tutuca 10 x 1 kg', quantity: 2 },
  ],
};

describe('PrintableOrder', () => {
  it('nombra al vendedor en el comprobante', () => {
    render(<PrintableOrder order={order} />);

    expect(screen.getByText(/Vendedor:/)).toBeInTheDocument();
    expect(screen.getByText(/Eduardo Horlacher/)).toBeInTheDocument();
  });

  it('cae al slug si ese vendedor ya no esta en la lista', () => {
    render(<PrintableOrder order={{ ...order, seller_id: 'un-vendedor-viejo' }} />);

    expect(screen.getByText(/un-vendedor-viejo/)).toBeInTheDocument();
  });

  it('omite la linea si el pedido no tiene vendedor', () => {
    render(<PrintableOrder order={{ ...order, seller_id: null }} />);

    expect(screen.queryByText(/Vendedor:/)).not.toBeInTheDocument();
  });

  it('lleva los datos del pedido y el total', () => {
    render(<PrintableOrder order={order} />);

    expect(screen.getByText(/Kiosco Luna/)).toBeInTheDocument();
    expect(screen.getByText(/9 \+ IVA/)).toBeInTheDocument();
    expect(screen.getByText(/TransFer/)).toBeInTheDocument();
    expect(screen.getByText(/Entregar por la mañana/)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('lista codigo, producto y cantidad de cada item', () => {
    render(<PrintableOrder order={order} />);

    expect(screen.getByText('0007')).toBeInTheDocument();
    expect(screen.getByText('Bolita crocante 7 x 1 kg')).toBeInTheDocument();
    expect(screen.getByText('0025')).toBeInTheDocument();
  });

  it('no dibuja nada sin pedido', () => {
    const { container } = render(<PrintableOrder order={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
