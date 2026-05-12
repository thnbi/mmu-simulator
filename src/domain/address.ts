import { PAGE_SIZE, VIRTUAL_ADDRESS_SPACE } from './constants';
import { asOffset, asPage, type LogicalAddress, type Offset, type PageNumber } from './types';

export function decomporEndereco(logical: LogicalAddress): { page: PageNumber; offset: Offset } {
  if (logical < 0 || logical >= VIRTUAL_ADDRESS_SPACE) {
    throw new RangeError(
      `Endereço lógico fora do espaço virtual: recebi ${logical}, esperado 0..${VIRTUAL_ADDRESS_SPACE - 1}`,
    );
  }
  const page = asPage(Math.floor(logical / PAGE_SIZE));
  const offset = asOffset(logical % PAGE_SIZE);
  return { page, offset };
}
