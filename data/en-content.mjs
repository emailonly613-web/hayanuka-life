// hayanuka.life — English content layer.
// All translations hand-written by Claude from the official Hebrew (hayanuka.com scrape).
// No machine-translation service, no local AI. Titles keep Hebrew alongside English.

export const CATEGORIES_EN = {
  "מוסר": { en: "Mussar", sub: "Character, growth & self-work" },
  "עניני דיומא": { en: "Timely Torah", sub: "The Jewish moment — chagim, current themes" },
  "פרשת שבוע": { en: "The Weekly Parashah", sub: "On the Torah reading of the week" },
  "הלכה": { en: "Halachah", sub: "Practical Jewish law" },
  "תיעוד": { en: "Moments", sub: "Documented moments with the Rav" },
  "כללי": { en: "General", sub: "" },
  "מיוחד": { en: "Special Editions", sub: "" },
  "חגים": { en: "Festivals", sub: "" },
  "תפילות": { en: "Tefillos", sub: "Prayers composed by the Rav" },
  "סגולות": { en: "Segulos", sub: "Composed for special merit" },
  "ניגונים": { en: "Niggunim", sub: "Melodies of the soul" },
  "חסידות": { en: "Chassidus", sub: "" },
  "סיפורים": { en: "Stories", sub: "" },
};

// The 19 curated videos from the official site (id = YouTube id)
export const VIDEOS_EN = {
  "0jZK-Ngzpuw": "On Middos and Knowing Yourself",
  "9kuwHjkDbIM": "A Shiur That Opens a Gate to Life",
  "xi4AuDxAiOI": "A Shiur from Iyar 5779",
  "_FU3pjbnYKE": "How the Torah Was Handed Down",
  "aQk4JmUzGlg": "The Secret of the Parah Adumah",
  "GEdLLkLOtyc": "The Historic Shiur at Kehillas Beis Yisrael",
  "Ab6-W__30b8": "A Remarkable Derashah on the Churban",
  "eZB8fyVStUs": "The Rav Speaks Sharply on the Matter of Salt",
  "Bqvs5BHwTq8": "Preparing for the Days of Chanukah",
  "_buZ9J_fEPg": "A Shiur Overflowing with Torah and Wisdom",
  "OIuPIWMSMK0": "Moments of Joy at the Hilula of Rabbi Shimon bar Yochai",
  "1peYrCBdaNI": "A Rare Glimpse into the Life and Ways of the Yanuka",
  "ofexJVGlXbM": "Es Ratzon — the Longing of Moshe Rabbeinu",
  "M60WieIz508": "The One Thing That Dissolves Every Problem",
  "EBRfJIjng1Y": "Historic Footage — the Bris with Toldos Aharon",
  "L3MRKowRK3I": "Highlights — Thousands Gather for the Shiur and Siyumim",
  "Eh7vQlcJqdQ": "A Historic Torah Gathering in Tzfas",
  "QKg2cVxKiWE": "Rav Eliyahu Biton on the Yanuka's Shiur in Tzfas",
  "rbOZn6g2DSA": "At the Wedding of the Rosh HaYeshiva's Grandson",
};

// The 10 tefillos & segulos (matched by Hebrew title)
export const TFILOT_EN = {
  "תפילה לפדיון שבויים": "Prayer for the Redemption of Captives",
  "תפילת חבקוק": "The Prayer of Chavakuk",
  "תפילה נוראה מאת הגאון הינוקא": "An Awesome Prayer Composed by the Yanuka",
  "תפילה לעורר זכות רחל אימנו": "Prayer to Awaken the Merit of Rachel Imeinu",
  "תפילה לזיווג לאישה": "Prayer for a Zivug — for a Woman",
  "תפילה לזיווג הגון לאיש": "Prayer for a Worthy Zivug — for a Man",
  "סגולה לזרע של קיימא לאיש": "Segulah for Children — for a Man",
  "סגולה לזרע של קיימא לאישה": "Segulah for Children — for a Woman",
  "תפילה לפרנסה ושלוות נפש": "Prayer for Parnassah and Peace of Mind",
  "תפילה לרפואה": "Prayer for Healing",
};

// The 12 niggunim (matched by Hebrew title)
export const MUSIC_EN = {
  "שהאמת תתגלה": "May the Truth Be Revealed",
  "הללוהו בנבל": "Praise Him with the Harp",
  "געגועים": "Longing",
  "שרו של ים": "The Angel of the Sea",
  "ניגון הלב": "Niggun of the Heart",
  "מחכה": "Waiting",
  "מתוך הקושי": "From Within the Struggle",
  "הושט יד": "Reach Out a Hand",
  "הרועה הבודד": "The Lone Shepherd",
  "זמן חרותנו": "The Season of Our Freedom",
  "לצאת מהמיצר": "Out of the Narrow Place",
  "פריחת האילנות": "The Blossoming of the Trees",
};

// Parashah + calendar transliteration map for the 193 alonim ("משלחן שלמה <parashah> <year>")
export const PARASHA_EN = {
  "בראשית": "Bereishis", "נח": "Noach", "לך לך": "Lech Lecha", "וירא": "Vayeira",
  "חיי שרה": "Chayei Sarah", "תולדות": "Toldos", "ויצא": "Vayeitzei", "וישלח": "Vayishlach",
  "וישב": "Vayeishev", "מקץ": "Mikeitz", "ויגש": "Vayigash", "ויחי": "Vayechi",
  "שמות": "Shemos", "וארא": "Va'eira", "בא": "Bo", "בשלח": "Beshalach", "יתרו": "Yisro",
  "משפטים": "Mishpatim", "תרומה": "Terumah", "תצוה": "Tetzaveh", "כי תשא": "Ki Sisa",
  "ויקהל": "Vayakhel", "פקודי": "Pekudei", "ויקרא": "Vayikra", "צו": "Tzav",
  "שמיני": "Shemini", "תזריע": "Tazria", "מצורע": "Metzora", "אחרי": "Acharei Mos",
  "אחרי מות": "Acharei Mos", "קדושים": "Kedoshim", "אמור": "Emor", "בהר": "Behar",
  "בחוקותי": "Bechukosai", "בחקותי": "Bechukosai", "במדבר": "Bamidbar", "נשא": "Naso",
  "בהעלותך": "Beha'aloscha", "שלח": "Shelach", "קרח": "Korach", "חקת": "Chukas",
  "בלק": "Balak", "פנחס": "Pinchas", "מטות": "Matos", "מסעי": "Masei",
  "דברים": "Devarim", "ואתחנן": "Va'eschanan", "עקב": "Eikev", "ראה": "Re'eh",
  "שופטים": "Shoftim", "כי תצא": "Ki Seitzei", "כי תבוא": "Ki Savo", "נצבים": "Nitzavim",
  "וילך": "Vayeilech", "האזינו": "Ha'azinu", "וזאת הברכה": "Vezos Haberachah",
  "שבועות": "Shavuos", "פסח": "Pesach", "חוה״מ פסח": "Chol HaMoed Pesach",
  "סוכות": "Sukkos", "ראש השנה": "Rosh Hashanah", "יום כיפור": "Yom Kippur",
  "חנוכה": "Chanukah", "פורים": "Purim", "ל״ג בעומר": "Lag BaOmer",
  "תשעה באב": "Tishah B'Av", "ט״ו בשבט": "Tu BiShvat",
};

export const YEARS_EN = {
  'תשפ"ב': "5782", "תשפ״ב": "5782", 'תשפ"ג': "5783", "תשפ״ג": "5783",
  'תשפ"ד': "5784", "תשפ״ד": "5784", 'תשפ"ה': "5785", "תשפ״ה": "5785",
  'תשפ"ו': "5786", "תשפ״ו": "5786",
};

// The Rav's story — hand-adapted into English from the official Hebrew biography.
export const STORY_EN = {
  title: "The Yanuka",
  name: "HaGaon Rav Shlomo Yehuda Beeri shlit”a",
  epigraph:
    "“A sight unseen for generations — a young man fluent in the entire Torah. Elders and the geonim of the land sit before him to hear his words, and all rejoice in him like one who has found a great treasure.”",
  sections: [
    {
      heading: "Why “the Yanuka”",
      paragraphs: [
        "Because of the rare scope of his Torah knowledge — rarer still for his age — he has been known from his youth as “the Yanuka,” a title drawn from the holy Zohar for a prodigy whose brilliance is revealed while still a child.",
        "His shiurim have become renowned. Thousands stream to them from every part of the Jewish world — among them accomplished talmidei chachamim and elders who consider him their teacher. Gedolei Yisrael have themselves come to hear him, and some have said that a neshamah like this descends to the world once in many generations.",
      ],
    },
    {
      heading: "The Shiurim",
      paragraphs: [
        "The shiurim are delivered without prior preparation. Most begin from a question raised by someone in the crowd. From there the Yanuka cites hundreds of sources spanning the entire Torah library — the sages of every era and every stream — and, in a breathtaking arc, weaves their words into a single path and approach.",
        "Those who have truly listened understand: these are not merely “classes.” They are a living derech of Torah — a crown restored, a lifeline in a stormy sea, pure waters that cleanse the heart toward closeness to Hashem, yirah, ahavah, and the keeping of Torah.",
      ],
    },
    {
      heading: "The Music",
      paragraphs: [
        "The Yanuka is deeply connected to the world of melody. With unusual talent he plays several keyboard instruments, and after shiurim he often sits at the piano playing niggunim of soul and feeling — many of which he composed himself. Well-known musicians sometimes join him.",
      ],
    },
    {
      heading: "His Way",
      paragraphs: [
        "In his unique way, the Yanuka unites streams, communities, and circles that rarely sit together. A guiding principle of his learning: at the root, the early sages did not disagree — all of them aimed, in their learning, at the same goal: to serve the G-d of heaven and earth and bring Him nachas ruach. From complete love and desire to do His will precisely, they arrived at different paths and conclusions in His service.",
        "Among his many students you see every shade of the Jewish people learning in a togetherness and love that has hardly been seen. He constantly teaches, and proves from the sources, that the way of the Creator is to honor every creature formed in His image — and to love every single one.",
      ],
    },
    {
      heading: "Tefillos and Berachos",
      paragraphs: [
        "The Yanuka's tefillos and berachos are famed. Tens of thousands around the world seek his blessing, and many attest to salvation and wonders beyond the way of nature.",
      ],
    },
    {
      heading: "The Torah Institute",
      paragraphs: [
        "The Torah Institute of the Yanuka's beis midrash was founded in 5780 (2020) by a team of rabbanim from his study hall. It has taken upon itself to gather his shiurim, derashos, and writings — a body of Torah that began in 5765 (2005) — an enormous treasury spanning every area of Yiddishkeit, all of Pardes, halachah and hashkafah, awaiting its hour to be published and to light up the world.",
        "The Institute also runs “De'ah es Hashem” — Torah shiurim delivered across Eretz Yisrael by rabbanim of his beis midrash — and publishes his many composed tefillos for different needs and seasons of the year.",
      ],
    },
  ],
};

export const SOCIALS = [
  { key: "whatsapp-en", label: "WhatsApp — English Group", handle: "Join & learn in English", url: "https://chat.whatsapp.com/DXiMaGJJtpSKUpeBEpHNKy?mode=ac_t", cta: "Join" },
  { key: "whatsapp-he", label: "WhatsApp — Hebrew Channel", handle: "ערוץ הינוקא בעברית", url: "https://whatsapp.com/channel/0029VbD8faQIyPtcBOAyvW0u", cta: "Follow" },
  { key: "instagram", label: "Instagram", handle: "@hayanuka", url: "https://www.instagram.com/hayanuka", cta: "Follow" },
  { key: "instagram2", label: "Instagram", handle: "@yanuka_rav_shlomoyehuda", url: "https://www.instagram.com/yanuka_rav_shlomoyehuda/", cta: "Follow" },
  { key: "facebook", label: "Facebook", handle: "hayanuka", url: "https://www.facebook.com/hayanuka", cta: "Follow" },
  { key: "tiktok", label: "TikTok", handle: "@the_yanuka_official", url: "https://www.tiktok.com/@the_yanuka_official", cta: "Follow" },
  { key: "official", label: "Official Site (Hebrew)", handle: "hayanuka.com", url: "https://hayanuka.com", cta: "Visit" },
  { key: "donate", label: "Support the Mosdos", handle: "official donation page", url: "https://hayanuka.com/he/donate", cta: "Donate" },
];

// "משלחן שלמה" — the weekly alon series name
export const ALON_SERIES_EN = "MiShulchan Shlomo — From the Table of Shlomo";
