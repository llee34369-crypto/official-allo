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

const SAFE_VOICE_QUEST_SENTENCES: Record<string, string[]> = {
  ar: [
    'يساعد سبيكر اي المستخدمين على قراءة جملة واضحة للتحقق من التسجيل اليومي.',
    'يمنح اختبار الصوت اليومي المشاركين طريقة بسيطة لتأكيد الكلمات المنطوقة بدقة.',
    'تجعل رحلة الصوت في سبيكر اي قراءة الجملة المطلوبة سهلة وآمنة.',
  ],
  bn: [
    'স্পিকারএআই ব্যবহারকারীদের পরিষ্কারভাবে বাক্য পড়ে দৈনিক ভয়েস চেক সম্পন্ন করতে সাহায্য করে।',
    'এই ভয়েস কুয়েস্ট অংশগ্রহণকারীদের সঠিক শব্দ পড়ে যাচাই করতে দেয়।',
    'নিরাপদ রেকর্ডিং ধাপটি স্পষ্ট উচ্চারণ দিয়ে প্রতিদিনের টাস্ক শেষ করতে সাহায্য করে।',
  ],
  de: [
    'SpeakerAI hilft Nutzern, einen klaren Satz zu lesen und die taegliche Sprachpruefung zu bestehen.',
    'Diese Sprachaufgabe laesst Teilnehmer einen sicheren Testsatz deutlich vorlesen.',
    'Der taegliche Aufnahmetest bestaetigt gesprochene Woerter mit einer kurzen klaren Lesung.',
  ],
  en: [
    'SpeakerAI helps users read a clear sentence for the daily voice check.',
    'This daily voice quest lets participants verify spoken words with a short safe phrase.',
    'The SpeakerAI recording test confirms clear speech with an easy guided sentence.',
  ],
  es: [
    'SpeakerAI ayuda a los usuarios a leer una frase clara para la verificacion diaria de voz.',
    'Esta prueba de voz permite a los participantes confirmar palabras habladas con una frase segura.',
    'El reto diario de grabacion verifica una lectura clara con una oracion sencilla.',
  ],
  fil: [
    'Tinutulungan ng SpeakerAI ang mga user na bumasa ng malinaw na pangungusap para sa daily voice check.',
    'Ang voice quest na ito ay para maberipika ang malinaw na pagbasa ng ligtas na prompt.',
    'Pinapadali ng recording test ng SpeakerAI ang tamang pagbasa ng maikling pangungusap.',
  ],
  fr: [
    'SpeakerAI aide les utilisateurs a lire une phrase claire pour la verification vocale quotidienne.',
    'Cette quete vocale permet aux participants de confirmer des mots prononces avec une phrase simple.',
    'Le test audio quotidien verifie une lecture nette avec une consigne sure.',
  ],
  hi: [
    'स्पीकरएआई उपयोगकर्ताओं को दैनिक वॉइस जांच के लिए एक स्पष्ट वाक्य पढ़ने में मदद करता है।',
    'यह वॉइस क्वेस्ट प्रतिभागियों को सुरक्षित पंक्ति बोलकर शब्दों की पुष्टि करने देता है।',
    'दैनिक रिकॉर्डिंग परीक्षण साफ उच्चारण के साथ सरल वाक्य की जांच करता है।',
  ],
  id: [
    'SpeakerAI membantu pengguna membaca kalimat jelas untuk pemeriksaan suara harian.',
    'Tugas suara ini membuat peserta memverifikasi kata yang diucapkan dengan frasa aman.',
    'Tes rekaman harian memeriksa ucapan yang jelas dengan kalimat panduan singkat.',
  ],
  it: [
    'SpeakerAI aiuta gli utenti a leggere una frase chiara per la verifica vocale giornaliera.',
    'Questa prova vocale consente ai partecipanti di confermare parole pronunciate con una frase sicura.',
    'Il test di registrazione quotidiano verifica una lettura chiara con una frase semplice.',
  ],
  ja: [
    'SpeakerAIは毎日の音声確認のために分かりやすい文を読めるようにします。',
    'この音声クエストでは安全な文章を読み上げて話した言葉を確認します。',
    '毎日の録音テストは短く明確な文章で発話を検証します。',
  ],
  ko: [
    'SpeakerAI는 일일 음성 확인을 위해 명확한 문장을 읽도록 도와줍니다.',
    '이 음성 퀘스트는 안전한 문장을 읽어 말한 단어를 확인합니다.',
    '매일 녹음 테스트는 짧고 분명한 문장으로 발화를 검증합니다.',
  ],
  ms: [
    'SpeakerAI membantu pengguna membaca ayat yang jelas untuk semakan suara harian.',
    'Tugasan suara ini membolehkan peserta mengesahkan perkataan yang disebut dengan frasa selamat.',
    'Ujian rakaman harian menyemak bacaan yang jelas dengan ayat panduan ringkas.',
  ],
  nl: [
    'SpeakerAI helpt gebruikers een duidelijke zin te lezen voor de dagelijkse stemcontrole.',
    'Deze stemopdracht laat deelnemers gesproken woorden bevestigen met een korte veilige zin.',
    'De dagelijkse opnametest controleert duidelijke spraak met een eenvoudige begeleide zin.',
  ],
  pl: [
    'SpeakerAI pomaga uzytkownikom przeczytac jasne zdanie do codziennej weryfikacji glosu.',
    'To zadanie glosowe pozwala uczestnikom potwierdzic wypowiedziane slowa bezpieczna fraza.',
    'Codzienny test nagrania sprawdza wyrazna mowe przy pomocy prostego zdania.',
  ],
  pt: [
    'SpeakerAI ajuda os usuarios a ler uma frase clara para a verificacao diaria de voz.',
    'Este desafio de voz permite aos participantes confirmar palavras faladas com uma frase segura.',
    'O teste diario de gravacao verifica uma leitura clara com uma frase simples.',
  ],
  ru: [
    'SpeakerAI помогает пользователям читать понятную фразу для ежедневной проверки голоса.',
    'Это голосовое задание позволяет участникам подтвердить произнесенные слова безопасной фразой.',
    'Ежедневный тест записи проверяет четкую речь с помощью простой подсказки.',
  ],
  sv: [
    'SpeakerAI hjaelper anvandare att lasa en tydlig mening for den dagliga rostkontrollen.',
    'Denna rostuppgift later deltagare bekrafta talade ord med en kort saker fras.',
    'Det dagliga inspelningstestet verifierar tydligt tal med en enkel mening.',
  ],
  sw: [
    'SpeakerAI husaidia watumiaji kusoma sentensi wazi kwa ukaguzi wa sauti wa kila siku.',
    'Jaribio hili la sauti huruhusu washiriki kuthibitisha maneno yaliyosemwa kwa sentensi salama.',
    'Mtihani wa kurekodi kila siku hukagua matamshi wazi kwa sentensi fupi rahisi.',
  ],
  ta: [
    'SpeakerAI பயனர்களுக்கு தினசரி குரல் சரிபார்ப்புக்கு தெளிவான வாக்கியத்தை வாசிக்க உதவுகிறது.',
    'இந்த குரல் பணியில் பாதுகாப்பான வரியை வாசித்து சொன்ன வார்த்தைகளை சரிபார்க்கலாம்.',
    'தினசரி பதிவு சோதனை எளிய வாக்கியத்தின் மூலம் தெளிவான உச்சரிப்பை சரிபார்க்கிறது.',
  ],
  th: [
    'SpeakerAI ช่วยให้ผู้ใช้อ่านประโยคที่ชัดเจนสำหรับการตรวจสอบเสียงประจำวัน',
    'ภารกิจเสียงนี้ให้ผู้เข้าร่วมยืนยันคำพูดด้วยประโยคที่ปลอดภัยและอ่านง่าย',
    'การทดสอบบันทึกเสียงรายวันตรวจสอบการพูดที่ชัดเจนด้วยประโยคสั้น ๆ',
  ],
  tr: [
    'SpeakerAI kullanicilarin gunluk ses kontrolu icin acik bir cumle okumasina yardimci olur.',
    'Bu ses gorevi katilimcilarin kisa ve guvenli bir ifade ile konusulan kelimeleri dogrulamasini saglar.',
    'Gunluk kayit testi acik konusmayi basit bir yonlendirme cumlesi ile kontrol eder.',
  ],
  uk: [
    'SpeakerAI допомагає користувачам читати зрозуміле речення для щоденної перевірки голосу.',
    'Це голосове завдання дозволяє учасникам підтвердити сказані слова безпечною фразою.',
    'Щоденний тест запису перевіряє чітке мовлення за допомогою простої підказки.',
  ],
  ur: [
    'اسپیکر اے آئی صارفین کو روزانہ وائس چیک کے لیے واضح جملہ پڑھنے میں مدد دیتا ہے۔',
    'یہ وائس کویسٹ شرکا کو محفوظ جملہ پڑھ کر بولے گئے الفاظ کی تصدیق کرنے دیتا ہے۔',
    'روزانہ ریکارڈنگ ٹیسٹ سادہ جملے کے ساتھ واضح ادائیگی کی جانچ کرتا ہے۔',
  ],
  vi: [
    'SpeakerAI giup nguoi dung doc mot cau ro rang cho viec kiem tra giong noi hang ngay.',
    'Nhiem vu giong noi nay cho phep nguoi tham gia xac minh tu da noi bang mot cau an toan.',
    'Bai kiem tra ghi am hang ngay xac minh cach doc ro rang bang mot cau don gian.',
  ],
  zh: [
    'SpeakerAI帮助用户朗读清晰句子完成每日语音验证。',
    '这个语音任务让参与者用安全短句确认朗读内容。',
    '每日录音测试通过简短明确的句子验证发音。',
  ],
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

  if (SAFE_VOICE_QUEST_SENTENCES[baseLanguage]) {
    return {
      languageCode: normalizedLanguageCode,
      sentences: SAFE_VOICE_QUEST_SENTENCES[baseLanguage],
    };
  }

  return {
    languageCode: DEFAULT_LANGUAGE_CODE,
    sentences: SAFE_VOICE_QUEST_SENTENCES.en,
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
  const { languageCode, sentences } = resolveVoiceQuestLanguage(requestedLanguageCode);
  const randomIndex = Math.floor(Math.random() * sentences.length);
  const expectedText = sentences[randomIndex];

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
