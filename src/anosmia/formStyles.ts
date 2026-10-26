// The wine "kind" chips, shared by the prototype's Type it in form and the wine-details edit sheet,
// so both render from one source. Values are the prototype's, unchanged.

/** "Roughly what kind?" chips. There is no separate colour field: a chosen kind is stored as `variety: "<Kind> wine"`. */
export const WINE_TYPES = ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Sweet'] as const

export const typeChipStyle = (selected: boolean) =>
  'height:48px;border-radius:14px;border:1.5px solid #1E1416;font-weight:650;font-size:14px;'
  + (selected ? 'background:#5A1427;color:#FBF6EA;border-color:#5A1427;' : 'background:transparent;')
