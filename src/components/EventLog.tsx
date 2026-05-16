import { useSimulatorStore } from '../store/simulator';

const KIND_STYLES: Record<string, string> = {
  translate: 'preset-tonal-success',
  'fault-invalid': 'preset-tonal-error',
  'fault-swap': 'preset-tonal-warning',
  allocate: 'preset-tonal-primary',
  'swap-in': 'preset-tonal-primary',
  evict: 'preset-tonal-warning',
  violation: 'preset-filled-error-500',
  info: 'preset-tonal-surface',
};

export function EventLog() {
  const eventos = useSimulatorStore((s) => s.eventos);

  if (eventos.length === 0) {
    return (
      <section className="card preset-outlined-surface-500 p-3 text-xs text-surface-700-300">
        Histórico vazio. Clique em uma variável para começar.
      </section>
    );
  }

  return (
    <section className="card preset-outlined-surface-500 p-3">
      <h2 className="h6 mb-2">Histórico</h2>
      <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto text-xs">
        {eventos
          .slice()
          .reverse()
          .map((e) => (
            <li key={e.id} className={`rounded-base ${KIND_STYLES[e.kind] ?? ''} px-2 py-1`}>
              {e.message}
            </li>
          ))}
      </ul>
    </section>
  );
}
