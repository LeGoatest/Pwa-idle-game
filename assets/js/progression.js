export function xpForLevel(level) {
  return Math.floor(20 * Math.pow(level, 1.4));
}

export function gainXp(state, skill, amount) {
  const xpKey = `${skill}Xp`;
  const levelKey = `${skill}Level`;

  state[xpKey] += amount;

  while (state[xpKey] >= xpForLevel(state[levelKey])) {
    state[xpKey] -= xpForLevel(state[levelKey]);
    state[levelKey] += 1;

    if (skill === 'combat') {
      state.attack += 1;
    }
  }
}
