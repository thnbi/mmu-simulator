import { AnimatePresence, motion } from 'motion/react';
import { ArcherElement } from 'react-archer';
import type { Translation, TranslationStep } from '../domain/types';
import { coresDoProcesso } from '../lib/colors';
import { useSimulatorStore } from '../store/simulator';

function relationsForStep(step: TranslationStep, traducao: Translation, stroke: string) {
  if (step.kind === 'read-ptbr') {
    return [
      {
        targetId: 'frame-0',
        targetAnchor: 'left' as const,
        sourceAnchor: 'right' as const,
        style: { strokeColor: stroke, strokeWidth: 2, lineStyle: 'curve' as const },
        label: <span className="text-xs">lê tabela</span>,
      },
    ];
  }
  if (step.kind === 'compute-physical') {
    return [
      {
        targetId: `frame-${traducao.frame}`,
        targetAnchor: 'left' as const,
        sourceAnchor: 'right' as const,
        style: { strokeColor: stroke, strokeWidth: 3, lineStyle: 'curve' as const },
        label: <span className="text-xs font-bold">acessa quadro {traducao.frame}</span>,
      },
    ];
  }
  return [];
}

export function MMUPanel() {
  const traducao = useSimulatorStore((s) => s.traducaoAtual);
  const ativo = useSimulatorStore((s) => s.processoAtivo);
  const cores = coresDoProcesso(ativo);

  return (
    <section className="card preset-outlined-surface-500 p-4">
      <h2 className="h4 mb-3">MMU</h2>
      {!traducao ? (
        <p className="text-sm text-surface-700-300">
          Clique em uma variável de um processo para ver a tradução passo a passo.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {traducao.steps.map((step, i) => {
              const stepId = `step-${step.kind}`;
              const relations = relationsForStep(step, traducao, cores.stroke);
              return (
                <ArcherElement key={stepId} id={stepId} relations={relations}>
                  <motion.li
                    key={`${traducao.logical}-${step.kind}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.25, duration: 0.25 }}
                    className="rounded-base bg-surface-100-900 p-3 text-sm"
                  >
                    <strong className="mr-2 text-primary-700-300">{i + 1}.</strong>
                    {descreverPasso(step)}
                  </motion.li>
                </ArcherElement>
              );
            })}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: traducao.steps.length * 0.25 + 0.1 }}
            className="mt-2 rounded-base bg-primary-100-900 p-3 text-sm font-semibold text-primary-700-300"
          >
            Endereço físico = 0x
            {traducao.physical.toString(16).padStart(4, '0').toUpperCase()} ({traducao.physical})
          </motion.div>
        </ol>
      )}
    </section>
  );
}

function descreverPasso(step: TranslationStep): string {
  switch (step.kind) {
    case 'decompose':
      return `Decompõe endereço lógico 0x${step.logical
        .toString(16)
        .padStart(4, '0')
        .toUpperCase()} → página ${step.page}, deslocamento 0x${step.offset
        .toString(16)
        .padStart(3, '0')
        .toUpperCase()}`;
    case 'read-ptbr':
      return `Lê PTBR de ${step.processId}: offset 0x${step.ptbrOffset
        .toString(16)
        .padStart(4, '0')
        .toUpperCase()} dentro do frame 0`;
    case 'lookup-entry':
      return `Consulta entrada da tabela: página ${step.page} → quadro ${step.frame}`;
    case 'compute-physical':
      return `Calcula endereço físico = ${step.frame} × 1024 + 0x${step.offset
        .toString(16)
        .padStart(3, '0')
        .toUpperCase()} = 0x${step.physical.toString(16).padStart(4, '0').toUpperCase()}`;
  }
}
