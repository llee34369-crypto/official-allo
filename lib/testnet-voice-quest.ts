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

interface VoiceQuestLanguageParts {
  openings: string[];
  actions: string[];
  endings: string[];
}

const TOKEN_DURATION_MS = 15 * 60 * 1000;
const DEFAULT_LANGUAGE_CODE = 'en-US';

const SAFE_VOICE_QUEST_PROMPTS: Record<string, VoiceQuestLanguageParts> = {
  ar: {
    openings: ['يساعد سبيكر اي المستخدمين', 'يمنح اختبار الصوت اليومي المشاركين', 'تجعل رحلة الصوت في سبيكر اي'],
    actions: ['على قراءة جملة واضحة', 'طريقة بسيطة لتأكيد الكلمات المنطوقة', 'قراءة الجملة المطلوبة بسهولة'],
    endings: ['للتحقق من التسجيل اليومي.', 'بدقة وبشكل آمن.', 'وإكمال الفحص اليومي بسرعة.'],
  },
  bn: {
    openings: ['স্পিকারএআই ব্যবহারকারীদের', 'এই ভয়েস কুয়েস্ট অংশগ্রহণকারীদের', 'নিরাপদ রেকর্ডিং ধাপটি'],
    actions: ['পরিষ্কারভাবে বাক্য পড়তে সাহায্য করে', 'সঠিক শব্দ পড়ে যাচাই করতে দেয়', 'স্পষ্ট উচ্চারণে বাক্য মিলাতে সাহায্য করে'],
    endings: ['দৈনিক ভয়েস চেক সম্পন্ন করতে।', 'নিরাপদ প্রম্পট অনুসরণ করতে।', 'প্রতিদিনের টাস্ক শেষ করতে।'],
  },
  de: {
    openings: ['SpeakerAI hilft Nutzern', 'Diese Sprachaufgabe laesst Teilnehmer', 'Der taegliche Aufnahmetest'],
    actions: ['einen klaren Satz lesen', 'einen sicheren Testsatz deutlich vorlesen', 'gesprochene Woerter sauber bestaetigen'],
    endings: ['und die taegliche Sprachpruefung bestehen.', 'mit einer kurzen klaren Lesung.', 'waehrend der Tagescheck aktiv ist.'],
  },
  en: {
    openings: ['SpeakerAI helps users', 'This daily voice quest lets participants', 'The SpeakerAI recording test'],
    actions: ['read a clear sentence', 'verify spoken words with a safe phrase', 'confirm clear speech with a guided prompt'],
    endings: ['for the daily voice check.', 'before claiming the daily reward.', 'during the secure recording step.'],
  },
  es: {
    openings: ['SpeakerAI ayuda a los usuarios', 'Esta prueba de voz permite a los participantes', 'El reto diario de grabacion'],
    actions: ['a leer una frase clara', 'confirmar palabras habladas con una frase segura', 'verificar una lectura clara con una oracion sencilla'],
    endings: ['para la verificacion diaria de voz.', 'durante el paso seguro de grabacion.', 'antes de reclamar la recompensa diaria.'],
  },
  fil: {
    openings: ['Tinutulungan ng SpeakerAI ang mga user', 'Ang voice quest na ito', 'Pinapadali ng recording test ng SpeakerAI'],
    actions: ['na bumasa ng malinaw na pangungusap', 'na maberipika ang malinaw na pagbasa', 'ang tamang pagbasa ng maikling pangungusap'],
    endings: ['para sa daily voice check.', 'ng ligtas na prompt.', 'bago kunin ang daily reward.'],
  },
  fr: {
    openings: ['SpeakerAI aide les utilisateurs', 'Cette quete vocale permet aux participants', 'Le test audio quotidien'],
    actions: ['a lire une phrase claire', 'de confirmer des mots prononces avec une phrase simple', 'de verifier une lecture nette avec une consigne sure'],
    endings: ['pour la verification vocale quotidienne.', 'avant la recompense du jour.', 'pendant le controle vocal securise.'],
  },
  hi: {
    openings: ['स्पीकरएआई उपयोगकर्ताओं को', 'यह वॉइस क्वेस्ट प्रतिभागियों को', 'दैनिक रिकॉर्डिंग परीक्षण'],
    actions: ['एक स्पष्ट वाक्य पढ़ने में मदद करता है', 'सुरक्षित पंक्ति बोलकर शब्दों की पुष्टि करने देता है', 'साफ उच्चारण के साथ सरल वाक्य मिलाने देता है'],
    endings: ['दैनिक वॉइस जांच के लिए।', 'दैनिक इनाम लेने से पहले।', 'सुरक्षित रिकॉर्डिंग चरण के दौरान।'],
  },
  id: {
    openings: ['SpeakerAI membantu pengguna', 'Tugas suara ini membuat peserta', 'Tes rekaman harian'],
    actions: ['membaca kalimat jelas', 'memverifikasi kata yang diucapkan dengan frasa aman', 'memeriksa ucapan yang jelas dengan kalimat panduan'],
    endings: ['untuk pemeriksaan suara harian.', 'sebelum klaim hadiah harian.', 'selama langkah rekaman yang aman.'],
  },
  it: {
    openings: ['SpeakerAI aiuta gli utenti', 'Questa prova vocale consente ai partecipanti', 'Il test di registrazione quotidiano'],
    actions: ['a leggere una frase chiara', 'di confermare parole pronunciate con una frase sicura', 'di verificare una lettura chiara con una frase semplice'],
    endings: ['per la verifica vocale giornaliera.', 'prima della ricompensa del giorno.', 'durante il passaggio di registrazione sicuro.'],
  },
  ja: {
    openings: ['SpeakerAIは利用者が', 'この音声クエストでは参加者が', '毎日の録音テストでは'],
    actions: ['分かりやすい文を読めるようにします', '安全な文章を読み上げて言葉を確認します', '短く明確な文章で発話を検証します'],
    endings: ['毎日の音声確認のためです。', '報酬の確認前に行います。', '安全な録音手順の中で進みます。'],
  },
  ko: {
    openings: ['SpeakerAI는 사용자가', '이 음성 퀘스트는 참가자가', '매일 녹음 테스트는'],
    actions: ['명확한 문장을 읽도록 도와줍니다', '안전한 문장을 읽어 말한 단어를 확인합니다', '짧고 분명한 문장으로 발화를 검증합니다'],
    endings: ['일일 음성 확인을 위해 진행됩니다.', '보상 전에 단어를 확인합니다.', '안전한 녹음 단계에서 동작합니다.'],
  },
  ms: {
    openings: ['SpeakerAI membantu pengguna', 'Tugasan suara ini membolehkan peserta', 'Ujian rakaman harian'],
    actions: ['membaca ayat yang jelas', 'mengesahkan perkataan yang disebut dengan frasa selamat', 'menyemak bacaan yang jelas dengan ayat panduan'],
    endings: ['untuk semakan suara harian.', 'sebelum tuntutan ganjaran harian.', 'dalam langkah rakaman yang selamat.'],
  },
  nl: {
    openings: ['SpeakerAI helpt gebruikers', 'Deze stemopdracht laat deelnemers', 'De dagelijkse opnametest'],
    actions: ['een duidelijke zin te lezen', 'gesproken woorden bevestigen met een korte veilige zin', 'duidelijke spraak controleren met een eenvoudige zin'],
    endings: ['voor de dagelijkse stemcontrole.', 'voor de dagelijkse beloning.', 'tijdens de veilige opnamestap.'],
  },
  pl: {
    openings: ['SpeakerAI pomaga uzytkownikom', 'To zadanie glosowe pozwala uczestnikom', 'Codzienny test nagrania'],
    actions: ['przeczytac jasne zdanie', 'potwierdzic wypowiedziane slowa bezpieczna fraza', 'sprawdzic wyrazna mowe prostym zdaniem'],
    endings: ['do codziennej weryfikacji glosu.', 'przed odebraniem dziennej nagrody.', 'podczas bezpiecznego kroku nagrania.'],
  },
  pt: {
    openings: ['SpeakerAI ajuda os usuarios', 'Este desafio de voz permite aos participantes', 'O teste diario de gravacao'],
    actions: ['a ler uma frase clara', 'confirmar palavras faladas com uma frase segura', 'verificar uma leitura clara com uma frase simples'],
    endings: ['para a verificacao diaria de voz.', 'antes da recompensa diaria.', 'durante a etapa segura de gravacao.'],
  },
  ru: {
    openings: ['SpeakerAI помогает пользователям', 'Это голосовое задание позволяет участникам', 'Ежедневный тест записи'],
    actions: ['читать понятную фразу', 'подтвердить произнесенные слова безопасной фразой', 'проверять четкую речь простой подсказкой'],
    endings: ['для ежедневной проверки голоса.', 'перед получением дневной награды.', 'во время безопасного шага записи.'],
  },
  sv: {
    openings: ['SpeakerAI hjaelper anvandare', 'Denna rostuppgift later deltagare', 'Det dagliga inspelningstestet'],
    actions: ['att lasa en tydlig mening', 'bekrafta talade ord med en kort saker fras', 'verifiera tydligt tal med en enkel mening'],
    endings: ['for den dagliga rostkontrollen.', 'innan dagens beloning.', 'under det sakra inspelningssteget.'],
  },
  sw: {
    openings: ['SpeakerAI husaidia watumiaji', 'Jaribio hili la sauti huruhusu washiriki', 'Mtihani wa kurekodi kila siku'],
    actions: ['kusoma sentensi wazi', 'kuthibitisha maneno yaliyosemwa kwa sentensi salama', 'kukagua matamshi wazi kwa sentensi fupi'],
    endings: ['kwa ukaguzi wa sauti wa kila siku.', 'kabla ya kudai zawadi ya kila siku.', 'wakati wa hatua salama ya kurekodi.'],
  },
  ta: {
    openings: ['SpeakerAI பயனர்களுக்கு', 'இந்த குரல் பணி பங்கேற்பாளர்களை', 'தினசரி பதிவு சோதனை'],
    actions: ['தெளிவான வாக்கியத்தை வாசிக்க உதவுகிறது', 'பாதுகாப்பான வரியை வாசித்து சொற்களை சரிபார்க்க உதவுகிறது', 'எளிய வாக்கியத்தின் மூலம் தெளிவான உச்சரிப்பை சரிபார்க்கிறது'],
    endings: ['தினசரி குரல் சரிபார்ப்புக்கு.', 'தினசரி பரிசை பெறும் முன்.', 'பாதுகாப்பான பதிவு கட்டத்தில்.'],
  },
  th: {
    openings: ['SpeakerAI ช่วยให้ผู้ใช้', 'ภารกิจเสียงนี้ให้ผู้เข้าร่วม', 'การทดสอบบันทึกเสียงรายวัน'],
    actions: ['อ่านประโยคที่ชัดเจน', 'ยืนยันคำพูดด้วยประโยคที่ปลอดภัย', 'ตรวจสอบการพูดที่ชัดเจนด้วยประโยคสั้น'],
    endings: ['สำหรับการตรวจสอบเสียงประจำวัน', 'ก่อนรับรางวัลประจำวัน', 'ระหว่างขั้นตอนบันทึกเสียงที่ปลอดภัย'],
  },
  tr: {
    openings: ['SpeakerAI kullanicilarin', 'Bu ses gorevi katilimcilarin', 'Gunluk kayit testi'],
    actions: ['acik bir cumle okumasina yardimci olur', 'guvenli bir ifade ile konusulan kelimeleri dogrulamasini saglar', 'acik konusmayi basit bir yonlendirme cumlesi ile kontrol eder'],
    endings: ['gunluk ses kontrolu icin.', 'gunluk odulden once.', 'guvenli kayit adimi sirasinda.'],
  },
  uk: {
    openings: ['SpeakerAI допомагає користувачам', 'Це голосове завдання дозволяє учасникам', 'Щоденний тест запису'],
    actions: ['читати зрозуміле речення', 'підтвердити сказані слова безпечною фразою', 'перевіряти чітке мовлення простою підказкою'],
    endings: ['для щоденної перевірки голосу.', 'перед щоденною нагородою.', 'під час безпечного етапу запису.'],
  },
  ur: {
    openings: ['اسپیکر اے آئی صارفین کو', 'یہ وائس کویسٹ شرکا کو', 'روزانہ ریکارڈنگ ٹیسٹ'],
    actions: ['واضح جملہ پڑھنے میں مدد دیتا ہے', 'محفوظ جملہ پڑھ کر بولے گئے الفاظ کی تصدیق کرنے دیتا ہے', 'سادہ جملے کے ساتھ واضح ادائیگی کی جانچ کرتا ہے'],
    endings: ['روزانہ وائس چیک کے لیے۔', 'روزانہ انعام لینے سے پہلے۔', 'محفوظ ریکارڈنگ مرحلے کے دوران۔'],
  },
  vi: {
    openings: ['SpeakerAI giup nguoi dung', 'Nhiem vu giong noi nay cho phep nguoi tham gia', 'Bai kiem tra ghi am hang ngay'],
    actions: ['doc mot cau ro rang', 'xac minh tu da noi bang mot cau an toan', 'kiem tra cach doc ro rang bang mot cau don gian'],
    endings: ['cho viec kiem tra giong noi hang ngay.', 'truoc khi nhan thuong hang ngay.', 'trong buoc ghi am an toan.'],
  },
  zh: {
    openings: ['SpeakerAI帮助用户', '这个语音任务让参与者', '每日录音测试'],
    actions: ['朗读清晰句子', '用安全短句确认朗读内容', '通过简短明确的句子验证发音'],
    endings: ['完成每日语音验证。', '再领取每日奖励。', '在安全录音步骤中完成。'],
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

  if (SAFE_VOICE_QUEST_PROMPTS[baseLanguage]) {
    return {
      languageCode: normalizedLanguageCode,
      prompts: SAFE_VOICE_QUEST_PROMPTS[baseLanguage],
    };
  }

  return {
    languageCode: DEFAULT_LANGUAGE_CODE,
    prompts: SAFE_VOICE_QUEST_PROMPTS.en,
  };
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
  const { languageCode, prompts } = resolveVoiceQuestLanguage(requestedLanguageCode);
  const expectedText = [
    prompts.openings[Math.floor(Math.random() * prompts.openings.length)],
    prompts.actions[Math.floor(Math.random() * prompts.actions.length)],
    prompts.endings[Math.floor(Math.random() * prompts.endings.length)],
  ].join(' ');

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
