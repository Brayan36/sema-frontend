import type { ComponentPropsWithoutRef } from 'react';

export default function Card({ className = '', ...props }: ComponentPropsWithoutRef<'section'>) {
  return <section className={`tarjeta ${className}`} {...props} />;
}
