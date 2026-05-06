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

interface VoiceQuestSentenceParts {
  openings: string[];
  middles: string[];
  qualifiers: string[];
  endings: string[];
}

type VoiceQuestSentenceTemplate = (
  opening: string,
  middle: string,
  qualifier: string,
  ending: string
) => string;

const TOKEN_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_LANGUAGE_CODE = 'en-US';
const VOICE_QUEST_SENTENCE_TEMPLATES: VoiceQuestSentenceTemplate[] = [
  (opening, middle, qualifier, ending) =>
    `${opening} ${middle} ${qualifier} ${ending}`,
  (opening, middle, qualifier, ending) =>
    `${opening} ${middle} ${ending} ${qualifier}`,
  (opening, middle, qualifier, ending) =>
    `${opening} ${qualifier} ${middle} ${ending}`,
  (opening, middle, qualifier, ending) =>
    `${opening} ${qualifier} ${ending} ${middle}`,
  (opening, middle, qualifier, ending) =>
    `${opening} ${middle} ${qualifier}, ${ending}`,
  (opening, middle, qualifier, ending) =>
    `${opening} ${middle} ${ending}, ${qualifier}`,
];

const SAFE_VOICE_QUEST_SENTENCE_PARTS: Record<string, VoiceQuestSentenceParts> = {
  ar: {
    openings: ['اقرأ', 'قل', 'ردد', 'انطق'],
    middles: ['هذه الكلمات', 'هذا السطر', 'هذه الجملة', 'هذا النص القصير'],
    qualifiers: ['بصوت واضح', 'بهدوء الآن', 'بشكل صحيح', 'بترتيب ثابت'],
    endings: ['دون توقف', 'في هذه المحاولة', 'خلال هذا الفحص', 'بصورة دقيقة'],
  },
  bn: {
    openings: ['পড়ুন', 'বলুন', 'আবার বলুন', 'উচ্চারণ করুন'],
    middles: ['এই শব্দগুলো', 'এই লাইনটি', 'এই বাক্যটি', 'এই ছোট পাঠটি'],
    qualifiers: ['স্পষ্ট কণ্ঠে', 'এখন ধীরে', 'সঠিকভাবে', 'একই ক্রমে'],
    endings: ['এই ধাপে', 'এই চেষ্টায়', 'ভয়েস চেকে', 'শান্তভাবে'],
  },
  de: {
    openings: ['Lies', 'Sage', 'Wiederhole', 'Sprich'],
    middles: ['diese Woerter', 'diese Zeile', 'diesen Satz', 'diesen kurzen Text'],
    qualifiers: ['ganz klar', 'jetzt ruhig', 'bitte sauber', 'in gleicher Reihenfolge'],
    endings: ['in diesem Versuch', 'bei diesem Check', 'ohne Hast', 'mit ruhiger Stimme'],
  },
  en: {
    openings: ['Read', 'Say', 'Repeat', 'Speak'],
    middles: ['these words', 'this line', 'this short sentence', 'this short prompt'],
    qualifiers: ['very clearly', 'right now', 'in order', 'with a calm voice'],
    endings: ['for this check', 'in one try', 'without rushing', 'for the next step'],
  },
  es: {
    openings: ['Lee', 'Di', 'Repite', 'Pronuncia'],
    middles: ['estas palabras', 'esta linea', 'esta frase corta', 'este texto breve'],
    qualifiers: ['muy claro', 'ahora mismo', 'en orden', 'con voz tranquila'],
    endings: ['en esta prueba', 'en este intento', 'sin prisa', 'para este paso'],
  },
  fil: {
    openings: ['Basahin', 'Sabihin', 'Ulitin', 'Bigkasin'],
    middles: ['ang mga salitang ito', 'ang linyang ito', 'ang maikling pangungusap na ito', 'ang maikling tekstong ito'],
    qualifiers: ['nang malinaw', 'ngayon na', 'sa tamang ayos', 'nang kalmado'],
    endings: ['sa pagsubok na ito', 'sa hakbang na ito', 'nang hindi nagmamadali', 'para sa susunod na bahagi'],
  },
  fr: {
    openings: ['Lis', 'Dis', 'Repete', 'Prononce'],
    middles: ['ces mots', 'cette ligne', 'cette phrase courte', 'ce court texte'],
    qualifiers: ['tres clairement', 'maintenant', 'dans l ordre', 'avec une voix calme'],
    endings: ['pour ce controle', 'dans cet essai', 'sans te presser', 'pour cette etape'],
  },
  hi: {
    openings: ['पढ़ो', 'बोलो', 'दोहराओ', 'उच्चारण करो'],
    middles: ['इन शब्दों को', 'इस पंक्ति को', 'इस छोटे वाक्य को', 'इस छोटे पाठ को'],
    qualifiers: ['साफ आवाज में', 'अभी धीरे', 'सही क्रम में', 'शांत स्वर में'],
    endings: ['इस जांच के लिए', 'इस प्रयास में', 'बिना जल्दी', 'अगले चरण के लिए'],
  },
  id: {
    openings: ['Baca', 'Ucapkan', 'Ulangi', 'Sebut'],
    middles: ['kata ini', 'baris ini', 'kalimat singkat ini', 'teks pendek ini'],
    qualifiers: ['dengan jelas', 'sekarang juga', 'berurutan', 'dengan suara tenang'],
    endings: ['untuk cek ini', 'dalam percobaan ini', 'tanpa terburu', 'untuk langkah berikutnya'],
  },
  it: {
    openings: ['Leggi', 'Di', 'Ripeti', 'Pronuncia'],
    middles: ['queste parole', 'questa riga', 'questa frase breve', 'questo testo breve'],
    qualifiers: ['molto chiaro', 'adesso', 'in ordine', 'con voce calma'],
    endings: ['per questo controllo', 'in questo tentativo', 'senza fretta', 'per il prossimo passo'],
  },
  ja: {
    openings: ['よんで', 'いって', 'くりかえして', 'のべて'],
    middles: ['このことばを', 'このぶんを', 'このみじかいぶんを', 'このみじかいテキストを'],
    qualifiers: ['はっきり', 'いま', 'じゅんばんどおりに', 'おちついて'],
    endings: ['このチェックで', 'このためしで', 'あわてずに', 'つぎのステップへ'],
  },
  ko: {
    openings: ['읽어', '말해', '따라 해', '발음해'],
    middles: ['이 단어를', '이 문장을', '이 짧은 문장을', '이 짧은 글을'],
    qualifiers: ['또렷하게', '지금', '순서대로', '차분하게'],
    endings: ['이 확인을 위해', '이번 시도에서', '서두르지 말고', '다음 단계로'],
  },
  ms: {
    openings: ['Baca', 'Sebut', 'Ulang', 'Lafazkan'],
    middles: ['perkataan ini', 'baris ini', 'ayat pendek ini', 'teks ringkas ini'],
    qualifiers: ['dengan jelas', 'sekarang', 'mengikut turutan', 'dengan suara tenang'],
    endings: ['untuk semakan ini', 'dalam cubaan ini', 'tanpa tergesa', 'untuk langkah seterusnya'],
  },
  nl: {
    openings: ['Lees', 'Zeg', 'Herhaal', 'Spreek'],
    middles: ['deze woorden', 'deze regel', 'deze korte zin', 'deze korte tekst'],
    qualifiers: ['heel duidelijk', 'nu meteen', 'op volgorde', 'met rustige stem'],
    endings: ['voor deze controle', 'in deze poging', 'zonder haast', 'voor de volgende stap'],
  },
  pl: {
    openings: ['Czytaj', 'Powiedz', 'Powtorz', 'Wypowiedz'],
    middles: ['te slowa', 'ten wers', 'to krotkie zdanie', 'ten krotki tekst'],
    qualifiers: ['bardzo wyraznie', 'teraz', 'po kolei', 'spokojnym glosem'],
    endings: ['w tej probie', 'dla tego sprawdzenia', 'bez pospiechu', 'do nastepnego kroku'],
  },
  pt: {
    openings: ['Leia', 'Diga', 'Repita', 'Pronuncie'],
    middles: ['estas palavras', 'esta linha', 'esta frase curta', 'este texto curto'],
    qualifiers: ['bem claro', 'agora', 'em ordem', 'com voz calma'],
    endings: ['nesta verificacao', 'nesta tentativa', 'sem pressa', 'para o proximo passo'],
  },
  ru: {
    openings: ['Прочитай', 'Скажи', 'Повтори', 'Произнеси'],
    middles: ['эти слова', 'эту строку', 'это короткое предложение', 'этот короткий текст'],
    qualifiers: ['очень четко', 'прямо сейчас', 'по порядку', 'спокойным голосом'],
    endings: ['для этой проверки', 'в этой попытке', 'без спешки', 'для следующего шага'],
  },
  sv: {
    openings: ['Las', 'Sag', 'Upprepa', 'Uttala'],
    middles: ['de har orden', 'den har raden', 'den har korta meningen', 'den har korta texten'],
    qualifiers: ['mycket tydligt', 'just nu', 'i ordning', 'med lugn rost'],
    endings: ['i den har kontrollen', 'i det har forsoeket', 'utan stress', 'for nasta steg'],
  },
  sw: {
    openings: ['Soma', 'Sema', 'Rudia', 'Tamka'],
    middles: ['maneno haya', 'mstari huu', 'sentensi hii fupi', 'maandishi haya mafupi'],
    qualifiers: ['kwa uwazi', 'sasa hivi', 'kwa mpangilio', 'kwa sauti tulivu'],
    endings: ['kwa ukaguzi huu', 'katika jaribio hili', 'bila haraka', 'kwa hatua inayofuata'],
  },
  ta: {
    openings: ['வாசி', 'சொல்', 'மீண்டும் சொல்', 'உச்சரி'],
    middles: ['இந்த சொற்களை', 'இந்த வரியை', 'இந்த குறும் வாக்கியத்தை', 'இந்த சிறு உரையை'],
    qualifiers: ['தெளிவாக', 'இப்போது', 'சரியான வரிசையில்', 'அமைதியான குரலில்'],
    endings: ['இந்த சோதனைக்கு', 'இந்த முயற்சியில்', 'அவசரமின்றி', 'அடுத்த கட்டத்திற்கு'],
  },
  th: {
    openings: ['อ่าน', 'พูด', 'พูดซ้ำ', 'ออกเสียง'],
    middles: ['คำเหล่านี้', 'บรรทัดนี้', 'ประโยคสั้นนี้', 'ข้อความสั้นนี้'],
    qualifiers: ['ให้ชัดเจน', 'ตอนนี้', 'ตามลำดับ', 'ด้วยเสียงนิ่ง'],
    endings: ['สำหรับการตรวจนี้', 'ในการลองครั้งนี้', 'แบบไม่รีบ', 'สำหรับขั้นตอนถัดไป'],
  },
  tr: {
    openings: ['Oku', 'Soyle', 'Tekrar et', 'Telaffuz et'],
    middles: ['bu kelimeleri', 'bu satiri', 'bu kisa cumleyi', 'bu kisa metni'],
    qualifiers: ['cok net', 'simdi', 'sirayla', 'sakin bir sesle'],
    endings: ['bu kontrol icin', 'bu denemede', 'acele etmeden', 'sonraki adim icin'],
  },
  uk: {
    openings: ['Прочитай', 'Скажи', 'Повтори', 'Промов'],
    middles: ['ці слова', 'цей рядок', 'це коротке речення', 'цей короткий текст'],
    qualifiers: ['дуже чітко', 'зараз', 'по порядку', 'спокійним голосом'],
    endings: ['для цієї перевірки', 'у цій спробі', 'без поспіху', 'для наступного кроку'],
  },
  ur: {
    openings: ['پڑھو', 'بولو', 'دہراؤ', 'ادا کرو'],
    middles: ['یہ الفاظ', 'یہ سطر', 'یہ مختصر جملہ', 'یہ مختصر متن'],
    qualifiers: ['واضح آواز میں', 'ابھی', 'ترتیب سے', 'پرسکون لہجے میں'],
    endings: ['اس چیک کے لیے', 'اس کوشش میں', 'بغیر جلدی', 'اگلے مرحلے کے لیے'],
  },
  vi: {
    openings: ['Doc', 'Noi', 'Lap lai', 'Phat am'],
    middles: ['nhung tu nay', 'dong nay', 'cau ngan nay', 'doan ngan nay'],
    qualifiers: ['rat ro', 'ngay bay gio', 'dung thu tu', 'bang giong deu'],
    endings: ['cho lan kiem tra nay', 'trong lan thu nay', 'khong voi vang', 'cho buoc tiep theo'],
  },
  zh: {
    openings: ['朗读', '说出', '重复', '念出'],
    middles: ['这些词语', '这一行', '这个短句', '这段短文本'],
    qualifiers: ['要清晰', '就是现在', '按顺序', '用平稳语气'],
    endings: ['完成这次检查', '用于这次尝试', '不要着急', '进入下一步'],
  },
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

function getNormalizedWords(value: string) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
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

  if (SAFE_VOICE_QUEST_SENTENCE_PARTS[baseLanguage]) {
    return {
      languageCode: normalizedLanguageCode,
      parts: SAFE_VOICE_QUEST_SENTENCE_PARTS[baseLanguage],
    };
  }

  return {
    languageCode: DEFAULT_LANGUAGE_CODE,
    parts: SAFE_VOICE_QUEST_SENTENCE_PARTS.en,
  };
}

function pickRandomValue<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)];
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
  const { languageCode, parts } = resolveVoiceQuestLanguage(requestedLanguageCode);
  const template = pickRandomValue(VOICE_QUEST_SENTENCE_TEMPLATES);
  const expectedText = template(
    pickRandomValue(parts.openings),
    pickRandomValue(parts.middles),
    pickRandomValue(parts.qualifiers),
    pickRandomValue(parts.endings)
  )
    .replace(/\s+/g, ' ')
    .trim();

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

export function doesVoiceQuestTranscriptMatchExpected(
  transcriptText: string,
  expectedText: string
) {
  const expectedWords = getNormalizedWords(expectedText);
  const transcriptWords = getNormalizedWords(transcriptText);

  if (!expectedWords.length || !transcriptWords.length) {
    return false;
  }

  let matchedWordCount = 0;

  for (const transcriptWord of transcriptWords) {
    if (transcriptWord === expectedWords[matchedWordCount]) {
      matchedWordCount += 1;

      if (matchedWordCount >= expectedWords.length) {
        return true;
      }

      continue;
    }

    matchedWordCount = transcriptWord === expectedWords[0] ? 1 : 0;

    if (matchedWordCount >= expectedWords.length) {
      return true;
    }
  }

  return false;
}
