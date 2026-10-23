import { useEffect } from 'react'
import { useDCLogic } from '../dc/DCLogic'
import type { Persistence } from '../data/persistence'
import { AnosmiaLogic, type Props } from './AnosmiaLogic'
import { AnosmiaView } from './AnosmiaView'

// Defaults match the prototype's declared props.
const DEFAULTS: Props = { device: '390 × 844', startScreen: 'welcome' }

export function Anosmia({ persistence, ...props }: Props & { persistence?: Persistence }) {
  const logic = useDCLogic(() => {
    const created = new AnosmiaLogic({ ...DEFAULTS, ...props })
    if (persistence) created.state = { ...created.state, ...persistence.initial }
    return created
  })
  useEffect(() => persistence?.attach(logic), [logic, persistence])
  return <AnosmiaView v={logic.renderVals()} />
}
