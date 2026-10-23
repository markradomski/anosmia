import { useDCLogic } from '../dc/DCLogic'
import { AnosmiaLogic, type Props } from './AnosmiaLogic'
import { AnosmiaView } from './AnosmiaView'

// Defaults match the prototype's declared props.
const DEFAULTS: Props = { device: '390 × 844', startScreen: 'welcome' }

export function Anosmia(props: Props) {
  const logic = useDCLogic(() => new AnosmiaLogic({ ...DEFAULTS, ...props }))
  return <AnosmiaView v={logic.renderVals()} />
}
