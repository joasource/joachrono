import { useCallback, useEffect, useRef, useState } from 'react';

import {
  avancar,
  criar,
  iniciar,
  pausar,
  restanteMs,
  retomar,
  tick,
  voltar,
  type Estado,
  type Evento,
  type Passo,
} from '../motor';
import { useSinais } from './useSinais';

const INTERVALO_MS = 100;
const CONTAGEM_REGRESSIVA_S = 3;

/** Liga a máquina de estados do motor ao relógio, ao som e à vibração. */
export function useExecucao(passos: Passo[]) {
  const [estado, setEstado] = useState<Estado>(() => criar(passos));
  const [agora, setAgora] = useState(() => Date.now());
  const estadoRef = useRef(estado);
  const ultimoSegundoAvisado = useRef<number | null>(null);
  const sinais = useSinais();
  const sinaisRef = useRef(sinais);
  useEffect(() => {
    sinaisRef.current = sinais;
  }, [sinais]);

  const aplicar = useCallback((novo: Estado, eventos: Evento[] = []) => {
    estadoRef.current = novo;
    setEstado(novo);
    if (eventos.length > 0) {
      ultimoSegundoAvisado.current = null;
      // Várias trocas de uma vez (app voltou do segundo plano): um só sinal, o do último evento.
      const ultimo = eventos[eventos.length - 1];
      if (ultimo.tipo === 'fim') sinaisRef.current.sinalFim();
      else sinaisRef.current.sinalTroca();
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setAgora(t);
      const atual = estadoRef.current;
      if (atual.status !== 'contando') return;
      const { estado: novo, eventos } = tick(atual, t);
      if (eventos.length > 0) {
        aplicar(novo, eventos);
        return;
      }
      const resta = restanteMs(atual, t);
      if (resta === null) return;
      const s = Math.ceil(resta / 1000);
      if (s >= 1 && s <= CONTAGEM_REGRESSIVA_S && ultimoSegundoAvisado.current !== s) {
        ultimoSegundoAvisado.current = s;
        sinaisRef.current.sinalContagem();
      }
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [aplicar]);

  const acoes = {
    iniciar: () => aplicar(iniciar(estadoRef.current, Date.now())),
    pausar: () => aplicar(pausar(estadoRef.current, Date.now())),
    retomar: () => aplicar(retomar(estadoRef.current, Date.now())),
    avancar: () => {
      const r = avancar(estadoRef.current, Date.now());
      aplicar(r.estado, r.eventos);
    },
    voltar: () => aplicar(voltar(estadoRef.current, Date.now())),
    reiniciar: () => {
      ultimoSegundoAvisado.current = null;
      aplicar(criar(passos));
    },
  };

  return { estado, agora, acoes };
}
