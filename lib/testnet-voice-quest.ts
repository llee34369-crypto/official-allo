import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

interface SignedVoiceQuestTokenPayload {
  type: 'voice_sentence' | 'voice_claim';
  walletAddress: string;
  expectedText: string;
  transcriptText?: string;
  languageCode: string;
  exp: number;
}

const TOKEN_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_LANGUAGE_CODE = 'en-US';
const GENERATED_WORD_COUNT = 6;

const SAFE_VOICE_QUEST_WORD_BANKS: Record<string, string[]> = {
  ar: ['واضح', 'صوت', 'قراءة', 'كلمة', 'آمن', 'يومي', 'سريع', 'دقيق', 'سهل', 'نقي'],
  bn: ['স্পষ্ট', 'শব্দ', 'পাঠ', 'কণ্ঠ', 'নিরাপদ', 'দৈনিক', 'সহজ', 'দ্রুত', 'সঠিক', 'শান্ত'],
  de: ['klar', 'stimme', 'lesen', 'wort', 'sicher', 'taeglich', 'ruhig', 'einfach', 'sauber', 'schnell'],
  en: ['clear', 'voice', 'read', 'word', 'daily', 'safe', 'bright', 'steady', 'quick', 'clean'],
  es: ['claro', 'voz', 'leer', 'palabra', 'diario', 'seguro', 'calma', 'rapido', 'limpio', 'suave'],
  fil: ['linaw', 'boses', 'basa', 'salita', 'araw', 'ligtas', 'bilis', 'tama', 'ayos', 'hinahon'],
  fr: ['clair', 'voix', 'lire', 'mot', 'quotidien', 'serein', 'rapide', 'simple', 'net', 'calme'],
  hi: ['साफ', 'आवाज', 'पढ़ो', 'शब्द', 'दैनिक', 'सुरक्षित', 'सरल', 'तेज', 'शांत', 'सही'],
  id: ['jelas', 'suara', 'baca', 'kata', 'aman', 'harian', 'tenang', 'cepat', 'rapi', 'mudah'],
  it: ['chiaro', 'voce', 'leggi', 'parola', 'sicuro', 'giorno', 'calmo', 'rapido', 'pulito', 'semplice'],
  ja: ['クリア', 'こえ', 'よむ', 'ことば', 'あんぜん', 'まいにち', 'しずか', 'はやい', 'かるい', 'きれい'],
  ko: ['또렷', '목소리', '읽기', '단어', '안전', '매일', '차분', '빠르게', '정확', '깨끗'],
  ms: ['jelas', 'suara', 'baca', 'kata', 'selamat', 'harian', 'tenang', 'pantas', 'mudah', 'kemas'],
  nl: ['helder', 'stem', 'lees', 'woord', 'veilig', 'dagelijks', 'rustig', 'snel', 'zuiver', 'eenvoudig'],
  pl: ['jasne', 'glos', 'czytaj', 'slowo', 'bezpieczne', 'dziennie', 'spokojnie', 'szybko', 'czysto', 'latwo'],
  pt: ['claro', 'voz', 'leia', 'palavra', 'diario', 'seguro', 'calmo', 'rapido', 'limpo', 'simples'],
  ru: ['четко', 'голос', 'читай', 'слово', 'ежедневно', 'безопасно', 'ровно', 'быстро', 'чисто', 'спокойно'],
  sv: ['klar', 'rost', 'las', 'ord', 'saker', 'daglig', 'lugn', 'snabb', 'ren', 'enkel'],
  sw: ['wazi', 'sauti', 'soma', 'neno', 'salama', 'kila', 'haraka', 'safi', 'tulivu', 'rahisi'],
  ta: ['தெளிவு', 'குரல்', 'வாசி', 'சொல்', 'பாதுகாப்பு', 'தினமும்', 'வேகம்', 'அமைதி', 'சரி', 'எளிது'],
  th: ['ชัด', 'เสียง', 'อ่าน', 'คำ', 'ปลอดภัย', 'ทุกวัน', 'เร็ว', 'นิ่ง', 'ง่าย', 'สะอาด'],
  tr: ['acik', 'ses', 'oku', 'kelime', 'guvenli', 'gunluk', 'sakin', 'hizli', 'temiz', 'kolay'],
  uk: ['чітко', 'голос', 'читай', 'слово', 'щодня', 'безпечно', 'спокійно', 'швидко', 'чисто', 'легко'],
  ur: ['واضح', 'آواز', 'پڑھو', 'لفظ', 'روزانہ', 'محفوظ', 'تیز', 'پرسکون', 'صاف', 'آسان'],
  vi: ['ro', 'giong', 'doc', 'tu', 'an', 'hangngay', 'nhanh', 'sach', 'deu', 'donian'],
  zh: ['清晰', '声音', '朗读', '词语', '安全', '每日', '快速', '稳定', '简单', '干净'],
};

const normalizeWallet = (value: string) => value.trim().toLowerCase();

function getVoiceQuestSecret() {
  const explicitSecret = process.env.TESTNET_VOICE_QUEST_SECRET?.trim();
  const serviceRoleKey =
    process.env.TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY?.trim();

  const secret = explicitSecret || serviceRoleKey;

  if (!secret) {
    throw new Error(
      'Missing TESTNET_VOICE_QUEST_SECRET or TESTNET_POINTS_SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return secret;
}

function normalizeText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLanguageCode(value: string | null | undefined) {
  const fallback = DEFAULT_LANGUAGE_CODE;
  const trimmed = typeof value === 'string' ? value.trim() : '';

  if (!trimmed) {
    return fallback;
  }

  const sanitized = trimmed.replace(/[^a-zA-Z0-9-]/g, '');
  return sanitized || fallback;
}

function resolveVoiceQuestLanguage(languageCode: string | null | undefined) {
  const normalizedLanguageCode = normalizeLanguageCode(languageCode);
  const baseLanguage = normalizedLanguageCode.split('-')[0]?.toLowerCase() || 'en';

  if (SAFE_VOICE_QUEST_WORD_BANKS[baseLanguage]) {
    return {
      languageCode: normalizedLanguageCode,
      wordBank: SAFE_VOICE_QUEST_WORD_BANKS[baseLanguage],
    };
  }

  return {
    languageCode: DEFAULT_LANGUAGE_CODE,
    wordBank: SAFE_VOICE_QUEST_WORD_BANKS.en,
  };
}

function pickRandomWords(values: string[], count: number) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function encodeTokenPart(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeTokenPart(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signTokenPayload(payload: SignedVoiceQuestTokenPayload) {
  const payloadPart = encodeTokenPart(JSON.stringify(payload));
  const signature = createHmac('sha256', getVoiceQuestSecret())
    .update(payloadPart)
    .digest('base64url');

  return `${payloadPart}.${signature}`;
}

function verifySignedToken(
  token: string,
  expectedType: SignedVoiceQuestTokenPayload['type']
) {
  const [payloadPart, signaturePart] = token.split('.');

  if (!payloadPart || !signaturePart) {
    throw new Error('Invalid voice quest token.');
  }

  const expectedSignature = createHmac('sha256', getVoiceQuestSecret())
    .update(payloadPart)
    .digest();
  const providedSignature = Buffer.from(signaturePart, 'base64url');

  if (
    expectedSignature.length !== providedSignature.length ||
    !timingSafeEqual(expectedSignature, providedSignature)
  ) {
    throw new Error('Invalid voice quest token signature.');
  }

  const payload = JSON.parse(
    decodeTokenPart(payloadPart)
  ) as SignedVoiceQuestTokenPayload;

  if (payload.type !== expectedType) {
    throw new Error('Voice quest token type mismatch.');
  }

  if (Date.now() > payload.exp) {
    throw new Error('Voice quest token expired.');
  }

  return payload;
}

export function createVoiceQuestSentence(
  walletAddress: string,
  requestedLanguageCode?: string
) {
  const normalizedWalletAddress = normalizeWallet(walletAddress);
  const { languageCode, wordBank } = resolveVoiceQuestLanguage(requestedLanguageCode);
  const expectedText = pickRandomWords(wordBank, GENERATED_WORD_COUNT).join(' ');

  const payload: SignedVoiceQuestTokenPayload = {
    type: 'voice_sentence',
    walletAddress: normalizedWalletAddress,
    expectedText,
    languageCode,
    exp: Date.now() + TOKEN_DURATION_MS,
  };

  return {
    expectedText,
    languageCode,
    sentenceToken: signTokenPayload(payload),
  };
}

export function verifyVoiceQuestSentenceToken(token: string, walletAddress: string) {
  const payload = verifySignedToken(token, 'voice_sentence');
  const normalizedWalletAddress = normalizeWallet(walletAddress);

  if (payload.walletAddress !== normalizedWalletAddress) {
    throw new Error('Voice quest wallet mismatch.');
  }

  return payload;
}

export function createVoiceQuestClaimToken(
  walletAddress: string,
  expectedText: string,
  transcriptText: string,
  languageCode: string
) {
  const payload: SignedVoiceQuestTokenPayload = {
    type: 'voice_claim',
    walletAddress: normalizeWallet(walletAddress),
    expectedText: expectedText.trim(),
    transcriptText: transcriptText.trim(),
    languageCode: normalizeLanguageCode(languageCode),
    exp: Date.now() + TOKEN_DURATION_MS,
  };

  return signTokenPayload(payload);
}

export function verifyVoiceQuestClaimToken(token: string, walletAddress: string) {
  const payload = verifySignedToken(token, 'voice_claim');
  const normalizedWalletAddress = normalizeWallet(walletAddress);

  if (payload.walletAddress !== normalizedWalletAddress) {
    throw new Error('Voice quest wallet mismatch.');
  }

  return payload;
}

export function getNormalizedVoiceQuestText(value: string) {
  return normalizeText(value);
}
