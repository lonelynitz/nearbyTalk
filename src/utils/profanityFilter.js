const BAD_WORDS = new Set([
  'fuck','shit','ass','bitch','damn','hell','dick','pussy','cock','cunt',
  'bastard','slut','whore','fag','nigger','nigga','retard','rape',
  'penis','vagina','anus','tits','boobs','porn','sex','cum','jizz',
  'wanker','twat','prick','bollocks','arsehole','asshole','motherfucker',
  'bullshit','goddamn','dumbass','jackass','dipshit','shithead',
  'fucker','fucking','fucked','shitting','bitchy','dickhead',
]);

const LEET_MAP = {
  '@': 'a', '4': 'a', '3': 'e', '1': 'i', '!': 'i',
  '0': 'o', '$': 's', '5': 's', '7': 't', '+': 't',
};

function normalize(word) {
  let normalized = word.toLowerCase();
  for (const [leet, char] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(char);
  }
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  normalized = normalized.replace(/[^a-z]/g, '');
  return normalized;
}

export function containsProfanity(text) {
  const words = text.split(/\s+/);
  return words.some(word => BAD_WORDS.has(normalize(word)));
}

export function filterText(text) {
  return text.split(/(\s+)/).map(token => {
    if (/^\s+$/.test(token)) return token;
    const normalized = normalize(token);
    if (BAD_WORDS.has(normalized)) {
      return '*'.repeat(token.length);
    }
    return token;
  }).join('');
}
