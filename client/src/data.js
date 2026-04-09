export const POS = ['Levantadora', 'Oposta', 'Ponteira', 'Central', 'Líbero'];

export const ACT = {
  saque:        { l: 'Saque',    i: '🏐', o: ['Ace', 'Erro', 'Cont'] },
  recepcao:     { l: 'Recepção', i: '🤲', o: ['A', 'B', 'C', 'Erro'] },
  levantamento: { l: 'Levant.',  i: '👆', o: ['A', 'B', 'C', 'Erro'] },
  ataque:       { l: 'Ataque',   i: '💥', o: ['Ponto', 'Bloq', 'Erro', 'Cont'] },
  bloqueio:     { l: 'Bloqueio', i: '🧱', o: ['Ponto', 'Erro', 'Cont'] },
  defesa:       { l: 'Defesa',   i: '🛡️', o: ['A', 'B', 'C', 'Erro'] },
};

export const OC_COLORS = {
  Ace: '#10b981', Ponto: '#10b981', A: '#10b981',
  B: '#eab308', Cont: '#64748b',
  C: '#f97316', Bloq: '#f97316',
  Erro: '#ef4444',
};
