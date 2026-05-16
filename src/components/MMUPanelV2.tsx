import { motion } from 'motion/react';
import { framesUsuarioLivres, framesUsuarioOcupados } from '../domain/paging';
import { asFrame, type MMUResult, type TranslationStep } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';

export function MMUPanelV2() {
  const resultado = useSimulatorStore((s) => s.resultadoMMU);
  const ativo = useSimulatorStore((s) => s.processoAtivo);
  const cores = coresDoProcesso(ativo);

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">MMU</h2>
      {!resultado ? (
        <p className="text-sm text-surface-700-300">
          Clique em uma variável de um processo para iniciar a tradução. Páginas começam{' '}
          <strong>inválidas</strong> e geram <em>page fault</em> até serem alocadas.
        </p>
      ) : (
        <div className={`rounded-base border ${cores.border} bg-surface-100-900 p-3`}>
          <BadgeResultado resultado={resultado} />
          <CorpoResultado resultado={resultado} />
        </div>
      )}
      <FaltaPainel />
    </section>
  );
}

function BadgeResultado({ resultado }: { resultado: MMUResult }) {
  if (resultado.kind === 'translated') {
    return (
      <span className="badge preset-filled-success-500 mb-2 text-[10px]">Tradução normal</span>
    );
  }
  if (resultado.kind === 'fault-invalid') {
    return (
      <span className="badge preset-filled-error-500 mb-2 text-[10px]">
        Page fault — página inválida
      </span>
    );
  }
  return (
    <span className="badge preset-filled-warning-500 mb-2 text-[10px]">
      Page fault — página na swap
    </span>
  );
}

function CorpoResultado({ resultado }: { resultado: MMUResult }) {
  if (resultado.kind === 'translated') {
    return (
      <ol className="flex flex-col gap-2 text-sm">
        {resultado.steps.map((step, i) => (
          <motion.li
            key={step.kind}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.18, duration: 0.2 }}
            className="rounded-base bg-surface-50-950 p-2"
          >
            <strong className="mr-2 text-primary-700-300">{i + 1}.</strong>
            {descreverPasso(step)}
          </motion.li>
        ))}
        <li className="mt-1 rounded-base bg-primary-100-900 p-2 font-semibold text-primary-700-300">
          Endereço físico = 0x{hex(resultado.physical, 4)} ({resultado.physical})
        </li>
      </ol>
    );
  }

  if (resultado.kind === 'fault-invalid') {
    return (
      <p className="text-sm">
        {resultado.processId} acessou a página <strong>{resultado.page}</strong> (deslocamento 0x
        {hex(resultado.offset, 3)}), mas ela está <strong>INV</strong>. Aloque um quadro abaixo.
      </p>
    );
  }

  return (
    <p className="text-sm">
      {resultado.processId} acessou a página <strong>{resultado.page}</strong>, que está na swap,
      slot <strong>{resultado.slot}</strong>. Escolha um quadro para o swap-in.
    </p>
  );
}

function FaltaPainel() {
  const resultado = useSimulatorStore((s) => s.resultadoMMU);
  const processos = useSimulatorStore((s) => s.processosV2);
  const resolver = useSimulatorStore((s) => s.resolverFalta);
  const evictar = useSimulatorStore((s) => s.evictarEAlocar);
  const cancelar = useSimulatorStore((s) => s.cancelarFalta);
  const tentarKernel = useSimulatorStore((s) => s.tentarMapearKernel);

  if (!resultado || resultado.kind === 'translated') return null;

  const livres = framesUsuarioLivres(processos);
  const ocupados = framesUsuarioOcupados(processos);
  const acao = resultado.kind === 'fault-invalid' ? 'Alocar' : 'Swap-in';

  return (
    <div className="mt-3 rounded-base border border-warning-500 p-3">
      <h3 className="h6 mb-2 text-warning-700-300">Ação do SO</h3>
      <div className="mb-3 text-xs text-surface-700-300">
        Quadro 0 = tabelas, quadro 1 = kernel (protegido), 2–15 = usuário, 16–23 = swap.
      </div>

      {livres.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold">{acao} em quadro livre:</p>
          <div className="flex flex-wrap gap-1.5">
            {livres.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => resolver(f)}
                className="btn btn-sm preset-tonal-success"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {ocupados.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-semibold">
            {livres.length === 0
              ? 'Sem quadros livres — escolha um para liberar:'
              : 'Forçar substituição (envia para swap):'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ocupados.map((o) => (
              <button
                key={o.frame}
                type="button"
                onClick={() => evictar(o.frame)}
                className={`btn btn-sm ${coresDoProcesso(o.processId).chip}`}
                title={`Atualmente: ${o.processId} página ${o.page}`}
              >
                {o.frame}{' '}
                <span className="opacity-80">
                  ({o.processId}.pg{o.page})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-surface-300-700 pt-2">
        <button
          type="button"
          onClick={() => resolver(asFrame(1))}
          className="btn btn-sm preset-outlined-error-500"
          title="Tenta mapear o quadro do kernel — viola proteção"
        >
          Tentar quadro 1 (kernel)
        </button>
        <button
          type="button"
          onClick={tentarKernel}
          className="btn btn-sm preset-outlined-error-500"
          title="Demonstração: tentativa de acesso ao kernel"
        >
          Demo violação
        </button>
        <button type="button" onClick={cancelar} className="btn btn-sm preset-outlined-surface-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function descreverPasso(step: TranslationStep): string {
  switch (step.kind) {
    case 'decompose':
      return `Decompõe 0x${hex(step.logical, 4)} → página ${step.page}, desloc. 0x${hex(step.offset, 3)}`;
    case 'read-ptbr':
      return `Lê PTBR de ${step.processId}: offset 0x${hex(step.ptbrOffset, 4)} no frame 0`;
    case 'lookup-entry':
      return `Consulta tabela: página ${step.page} → quadro ${step.frame}`;
    case 'compute-physical':
      return `Endereço físico = ${step.frame} × 1024 + 0x${hex(step.offset, 3)} = 0x${hex(step.physical, 4)}`;
  }
}

function hex(n: number, width: number): string {
  return n.toString(16).padStart(width, '0').toUpperCase();
}
