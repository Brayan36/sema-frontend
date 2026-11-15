import { useEffect } from 'react';

export default function useTituloAcceso(titulo: string) {
  useEffect(() => {
    const anterior = document.title;
    document.title = `${titulo} | SEMA`;
    return () => { document.title = anterior; };
  }, [titulo]);
}
