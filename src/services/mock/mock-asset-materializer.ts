// Materializes openable mock files (PDFs with meaningful Serbian legal text,
// JPEG/PNG image placeholders, plain text, and an RTF "Word" stand-in) into the
// app cache so seeded mock documents have real, openable URIs. Each blob is
// written once per session and the resulting `file://` URI is memoized.
//
// PDFs are generated at runtime from a template + variant content so the file
// reflects the document's category (Punomocje, Tuzba, Ugovor, …) instead of
// every PDF being identical "Mock PDF" placeholder.

import * as FileSystem from 'expo-file-system/legacy';

// ────────────────────────────────────────────────────────────────────────────
// PDF builder
// ────────────────────────────────────────────────────────────────────────────

// PDF text strings have to escape (, ) and \ so the parser doesn't mistake them
// for delimiters. Cyrillic characters fall outside WinAnsiEncoding (Helvetica's
// default) so we strip diacritics; the result is the Latin text the rest of the
// app already uses.
//
// Also normalize anything outside ASCII to a Latin-1 equivalent so the PDF body
// can be safely run through `btoa` (which throws on chars > 255). Common
// typography punctuation (em-dash, en-dash, smart quotes, arrows, ellipses) is
// mapped to plain ASCII; any other high codepoint becomes "?".
function asciiSafe(s: string): string {
  return s.replace(/[^\x20-\x7E\n\r\t]/g, (ch) => {
    switch (ch) {
      case "—": case "–": return "-";
      case "“": case "”": case "„": return '"';
      case "‘": case "’": case "‚": return "'";
      case "…": return "...";
      case "→": return "->";
      case "←": return "<-";
      case "•": return "*";
      case " ": return " ";  // non-breaking space → regular space
      default: return "?";
    }
  });
}

function escapePdfText(s: string): string {
  return asciiSafe(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(title: string, paragraphs: string[]): string {
  // Build the text content stream.
  const lineHeight = 16;
  let stream = "BT\n/F1 16 Tf\n72 750 Td\n";
  stream += `(${escapePdfText(title)}) Tj\n`;
  stream += `0 -${lineHeight + 8} Td\n/F1 11 Tf\n`;
  let firstLine = true;
  for (const p of paragraphs) {
    const lines = wrapText(p, 78);
    for (const line of lines) {
      if (firstLine) {
        stream += `(${escapePdfText(line)}) Tj\n`;
        firstLine = false;
      } else {
        stream += `0 -${lineHeight} Td (${escapePdfText(line)}) Tj\n`;
      }
    }
    // Blank line between paragraphs
    stream += `0 -${lineHeight} Td () Tj\n`;
  }
  stream += "ET";

  // Assemble the PDF objects.
  const objects: string[] = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Count 1/Kids[3 0 R]>>",
    "<</Type/Page/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/MediaBox[0 0 612 792]/Contents 4 0 R>>",
    `<</Length ${stream.length}>>stream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`;

  return asciiToBase64(pdf);
}

// Greedy word-wrap to roughly maxChars per line.
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// PDFs we build are pure ASCII so btoa is safe.
function asciiToBase64(s: string): string {
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(s);
  // Fallback for very old runtimes — unlikely to hit in Expo SDK ≥ 50.
  const Buffer = (globalThis as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (Buffer) return Buffer.from(s, 'binary').toString('base64');
  throw new Error('No base64 encoder available');
}

// ────────────────────────────────────────────────────────────────────────────
// PDF templates (Latin Serbian legal-doc text, intentionally generic)
// ────────────────────────────────────────────────────────────────────────────

type PdfVariant =
  | 'punomocje' | 'tuzba' | 'ugovor' | 'presuda' | 'zapisnik'
  | 'krivicnaPrijava' | 'izjavaSvedoka' | 'izvod' | 'osnivacki'
  | 'zalba' | 'odluka' | 'sporazumRazvod' | 'generic';

const PDF_TEMPLATES: Record<PdfVariant, { title: string; paragraphs: string[] }> = {
  punomocje: {
    title: "PUNOMOCJE",
    paragraphs: [
      "Ja, dole potpisani vlastodavac, ovim aktom dajem punomocje advokatu Marku Petrovicu, sa sedistem u Beogradu, da me zastupa pred svim sudovima, drzavnim organima i drugim pravnim licima u svim postupcima koji se ticu nizenavedenog pravnog posla.",
      "Punomocnik je ovlascen da preduzima sve potrebne pravne radnje, ukljucujuci podnosenje podnesaka, prijem pismena, prisustvovanje rocistima, zakljucivanje poravnanja, kao i da se po potrebi supstituise drugim advokatom iz iste advokatske kancelarije.",
      "Ovo punomocje vazi do opoziva, koji vlastodavac mora dostaviti u pismenoj formi.",
      "U Beogradu, ovjereno kod javnog beleznika.",
    ],
  },
  tuzba: {
    title: "TUZBA",
    paragraphs: [
      "OPSTINSKOM SUDU U BEOGRADU",
      "Tuzilac: Nikola Stankovic, JMBG 1234567890123, sa prebivalistem u Beogradu, ulica Knez Mihailova 12.",
      "Tuzeni: AD Osiguranje doo, MB 12345678, sa sedistem u Beogradu, Bulevar kralja Aleksandra 65.",
      "Vrednost spora: 480.000,00 RSD",
      "PREDMET: Naknada materijalne i nematerijalne stete iz saobracajne nezgode.",
      "Dana 12.03.2024. godine doslo je do saobracajne nezgode u kojoj je tuzeni, kao odgovorni osiguravac vozila kojim je upravljao N.N., izazvao stetu na vozilu tuzioca registracije BG 123-AB i naneo mu telesne povrede.",
      "Tuzilac je pretrpeo materijalnu stetu u iznosu od 320.000,00 RSD na osnovu fakture za popravku vozila i nematerijalnu stetu zbog pretrpljenih bolova u iznosu od 160.000,00 RSD.",
      "Predlazem da sud, posle odrzanog rocista, donese presudu kojom se tuzeni obavezuje da tuziocu isplati navedene iznose sa zakonskom zateznom kamatom od dana podnosenja tuzbe do konacne isplate, kao i da naknadi troskove postupka.",
    ],
  },
  ugovor: {
    title: "UGOVOR",
    paragraphs: [
      "Ugovorne strane:",
      "1. Davalac usluge: Marko Petrovic, advokat, sa sedistem u Beogradu.",
      "2. Korisnik usluge: Klijent naveden u zaglavlju ovog ugovora.",
      "Predmet ugovora: Pruzanje pravnih usluga zastupanja klijenta u postupku navedenom u zaglavlju, ukljucujuci sastavljanje podnesaka, prisustvovanje rocistima i preduzimanje svih potrebnih pravnih radnji.",
      "Naknada: Klijent se obavezuje da advokatu plati naknadu prema vazecoj advokatskoj tarifi, sa mogucnoscu posebnog dogovora za pojedine radnje.",
      "Trajanje: Ugovor stupa na snagu danom potpisivanja i traje do okoncanja pravnog posla, sa pravom svake strane da ga otkaze uz prethodno pismeno obavestenje.",
      "Sve sporove iz ovog ugovora ugovorne strane resice sporazumno, a ako to nije moguce, nadlezan je sud u Beogradu.",
    ],
  },
  presuda: {
    title: "PRESUDA",
    paragraphs: [
      "U IME NARODA",
      "Opstinski sud u Beogradu, sudija pojedinac Petar Maric, u parnicnom postupku tuzioca Zivkovica protiv tuzenog X, radi naplate potrazivanja, posle odrzanog rocista zakljucenog dana 02.03.2025. godine, doneo je sledecu",
      "PRESUDU",
      "Tuzeni se obavezuje da tuziocu isplati iznos od 250.000,00 RSD sa zakonskom zateznom kamatom od dana dospelosti potrazivanja do konacne isplate, kao i da naknadi troskove parnicnog postupka u iznosu od 45.000,00 RSD, sve u roku od 15 dana od pravnosnaznosti presude.",
      "Obrazlozenje:",
      "Tuzilac je u toku postupka dokazao postojanje potrazivanja po osnovu pruzenih usluga, dok tuzeni nije osporio osnov niti visinu duga. Sud je, na osnovu izvedenih dokaza i ocene istih, doneo presudu kao u izreci.",
      "Pouka o pravnom leku: Protiv ove presude moze se izjaviti zalba u roku od 15 dana od dana prijema, putem ovog suda, Visem sudu u Beogradu.",
    ],
  },
  zapisnik: {
    title: "ZAPISNIK SA ROCISTA",
    paragraphs: [
      "Sud: Opstinski sud u Beogradu, sudnica broj 12, dana 15.03.2025. godine, sa pocetkom u 10:00 casova.",
      "Predsednik veca: sudija Jovan Markovic. Zapisnicar: Ana Ilic.",
      "Prisutni: tuzilac licno i njegov punomocnik advokat Marko Petrovic; tuzeni licno i njegov punomocnik.",
      "Tok rocista: Sudija je otvorio rociste i konstatovao prisutne. Procitana je tuzba i odgovor na tuzbu. Strane su iznele svoje predloge u pogledu izvodjenja dokaza. Saslusan je svedok N.N. koji je dao iskaz vezano za okolnosti slucaja.",
      "Posle saslusanja svedoka, sudija je odredio sledece rociste za 15.04.2025. godine u 10:00 casova radi izvodjenja preostalih dokaza.",
      "Rociste je zakljuceno u 11:30 casova.",
    ],
  },
  krivicnaPrijava: {
    title: "KRIVICNA PRIJAVA",
    paragraphs: [
      "OSNOVNOM JAVNOM TUZILASTVU U BEOGRADU",
      "Podnosilac prijave: Punomocnik ostecenog, advokat Marko Petrovic.",
      "Osumnjiceni: lice protiv kojeg se podnosi prijava, sa licnim podacima utvrdjenim u prilogu.",
      "PREDMET: Krivicno delo prevare iz clana 208. Krivicnog zakonika Republike Srbije.",
      "Iz raspolozivih dokaza proizlazi osnovana sumnja da je osumnjiceni u periodu od januara do marta 2024. godine na podrucju grada Beograda, u nameri pribavljanja protivpravne imovinske koristi, doveo u zabludu ostecenog lazima, navodeci ga da mu preda novcani iznos od 1.500.000,00 RSD na ime navodne investicije.",
      "Predlazem da javni tuzilac sprovede istragu i preduzme sve zakonom predvidjene radnje radi otkrivanja, gonjenja i kaznjavanja izvrsioca krivicnog dela.",
    ],
  },
  izjavaSvedoka: {
    title: "IZJAVA SVEDOKA",
    paragraphs: [
      "Ime i prezime: N.N.  JMBG: 9876543210987.  Adresa: Beograd, ulica Vojvode Stepe 45.",
      "Pred ovlascenim licem, dana 05.12.2024. godine, dao sam sledecu izjavu:",
      "Dana 28.11.2024. godine, oko 18:30 casova, nalazio sam se u kafiteriji u centru grada kada sam licno video kako lice slicno opisu osumnjicenog napusta zgradu nasuprot kafica, noseci torbu koja je odgovarala opisu nestale imovine.",
      "Lice je islo brzim hodom prema susednoj ulici i sislo niz stepenice u smeru parkinga. Ne mogu sa sigurnoscu reci da je u pitanju isto lice, ali fizicki opis odgovara.",
      "Izjavu dajem dobrovoljno, svestan da sam duzan govoriti istinu.",
    ],
  },
  izvod: {
    title: "IZVOD IZ MATICNE KNJIGE",
    paragraphs: [
      "Republika Srbija - Maticna sluzba grada Beograda",
      "Izvod iz maticne knjige vencanih za:",
      "Suprug: Nikola Stankovic, rodjen 14.05.1980. godine u Beogradu.",
      "Supruga: Marija Stankovic (rodjeno Petrovic), rodjena 22.08.1982. godine u Beogradu.",
      "Datum sklapanja braka: 18.09.2010. godine. Mesto sklapanja: Beograd.",
      "Brak je sklopljen pred maticarem na osnovu uredne dokumentacije i u prisustvu dva svedoka.",
      "Izdato po zahtevu stranke radi koriscenja u sudskom postupku.",
    ],
  },
  osnivacki: {
    title: "OSNIVACKI AKT DRUSTVA SA OGRANICENOM ODGOVORNOSCU",
    paragraphs: [
      "Na osnovu Zakona o privrednim drustvima Republike Srbije, ovim aktom osnivam drustvo sa ogranicenom odgovornoscu IT Solutions d.o.o.",
      "Sediste drustva: Beograd, ulica Bulevar Mihajla Pupina 165v.",
      "Pretezna delatnost: 6201 Racunarsko programiranje.",
      "Osnivacki kapital: 30.000,00 RSD, uplacen u celosti pre podnosenja registracione prijave.",
      "Direktor: imenovan od strane osnivaca, sa ovlascenjima predvidjenim zakonom i ovim aktom.",
      "Drustvo se osniva na neodredjeno vreme i upisuje u registar privrednih subjekata kod Agencije za privredne registre.",
    ],
  },
  zalba: {
    title: "ZALBA NA PRESUDU",
    paragraphs: [
      "VISEM SUDU U BEOGRADU - preko prvostepenog Opstinskog suda u Beogradu",
      "Zalilac: Punomocnik osudjenog, advokat Marko Petrovic.",
      "Predmet: Zalba na presudu Opstinskog suda u Beogradu broj K 158/2024 od 10.02.2025. godine.",
      "Pobijam presudu u celini, zbog bitne povrede odredaba krivicnog postupka, pogresno i nepotpuno utvrdjenog cinjenicnog stanja, kao i zbog odluke o krivicnoj sankciji.",
      "Sud prvog stepena nije pravilno cenio nalaz vestaka odbrane, niti je obrazlozio zasto je odbio predloge za izvodjenje dodatnih dokaza koje je odbrana isticala tokom glavnog pretresa.",
      "Predlazem da Visi sud u Beogradu prihvati zalbu, ukine pobijanu presudu i predmet vrati prvostepenom sudu na ponovno odlucivanje, ili da je preinaci u korist osudjenog.",
    ],
  },
  odluka: {
    title: "ODLUKA SKUPSTINE DRUSTVA",
    paragraphs: [
      "Skupstina drustva, sastala se dana 28.02.2025. godine u sedistu drustva, donela je sledecu",
      "ODLUKU O PROMENI SEDISTA DRUSTVA",
      "Postojece sediste drustva preselja se sa adrese Bulevar Mihajla Pupina 165v na novu adresu Bulevar kralja Aleksandra 84, Beograd.",
      "Direktor drustva ovlascuje se da preduzme sve potrebne radnje za upis promene sedista u registar privrednih subjekata kod Agencije za privredne registre, kao i da o promeni obavesti poslovne partnere i nadlezne organe.",
      "Odluka stupa na snagu danom donosenja.",
    ],
  },
  sporazumRazvod: {
    title: "SPORAZUM O RAZVODU BRAKA",
    paragraphs: [
      "Suprug i supruga, ovim sporazumom, postizu saglasnost o sledecim pitanjima u vezi sa razvodom braka:",
      "1. Saglasni su da se brak razvede sporazumno, bez utvrdjivanja krivice.",
      "2. Maloletna deca rodjena u braku ostaju da zive sa majkom, dok je otac duzan da placa redovno mesecno izdrzavanje u iznosu utvrdjenom posebnim sporazumom.",
      "3. Zajednicka imovina ce se podeliti tako sto svaka strana zadrzava imovinu koju je nabavila pre braka, a zajednicki stecena imovina deli se ravnopravno na osnovu spiska imovine koji cini sastavni deo ovog sporazuma.",
      "4. Strane se obavezuju da postupak razvoda sprovedu mirno i bez izazivanja dodatnih troskova.",
      "Sporazum se podnosi sudu zajedno sa zahtevom za sporazumni razvod braka.",
    ],
  },
  generic: {
    title: "MOCK DOKUMENT",
    paragraphs: [
      "Ovo je primer mock PDF dokumenta generisanog iskljucivo radi demonstracije aplikacije.",
      "Sadrzaj nije pravno obavezujuci niti se odnosi na stvarne osobe ili dogadjaje. U produkciji bi ovde bio pravi sadrzaj odgovarajuceg dokumenta.",
      "Aplikacija pravilno otvara ovaj fajl u sistemskom PDF citacu kako bi se proverilo da pipeline za otvaranje radi.",
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// PNG image generator (recognizable mock IDs / passports / generic docs)
// ────────────────────────────────────────────────────────────────────────────
// Pure-JS PNG builder so mock images look like cards / passports / docs instead
// of solid yellow squares. Each variant is composed from rectangles drawn into
// a pixel canvas, then encoded as an uncompressed (stored-blocks) PNG.

const crcTable: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked binary→string→btoa to avoid huge apply() argument lists.
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return globalThis.btoa(binary);
}

class PixelCanvas {
  buffer: Uint8Array;
  constructor(public width: number, public height: number) {
    this.buffer = new Uint8Array(width * height * 3);
  }
  fill(r: number, g: number, b: number): void {
    for (let i = 0; i < this.buffer.length; i += 3) {
      this.buffer[i] = r; this.buffer[i + 1] = g; this.buffer[i + 2] = b;
    }
  }
  rect(x: number, y: number, w: number, h: number, r: number, g: number, b: number): void {
    const x1 = Math.max(0, x), y1 = Math.max(0, y);
    const x2 = Math.min(this.width, x + w), y2 = Math.min(this.height, y + h);
    for (let py = y1; py < y2; py++) {
      for (let px = x1; px < x2; px++) {
        const i = (py * this.width + px) * 3;
        this.buffer[i] = r; this.buffer[i + 1] = g; this.buffer[i + 2] = b;
      }
    }
  }
  toPngBase64(): string {
    // Scanlines: each row prefixed with filter byte 0 (none).
    const rowSize = 1 + this.width * 3;
    const raw = new Uint8Array(this.height * rowSize);
    for (let y = 0; y < this.height; y++) {
      const dst = y * rowSize;
      raw[dst] = 0;
      const src = y * this.width * 3;
      raw.set(this.buffer.subarray(src, src + this.width * 3), dst + 1);
    }

    // zlib wrapping with stored (uncompressed) blocks.
    const blockCount = Math.max(1, Math.ceil(raw.length / 65535));
    const zlib = new Uint8Array(2 + blockCount * 5 + raw.length + 4);
    let zPos = 0;
    zlib[zPos++] = 0x78; // CMF (deflate, 32K window)
    zlib[zPos++] = 0x01; // FLG (no preset dict, fastest)
    let off = 0;
    do {
      const blockLen = Math.min(65535, raw.length - off);
      const isLast = off + blockLen >= raw.length;
      zlib[zPos++] = isLast ? 1 : 0;
      zlib[zPos++] = blockLen & 0xff;
      zlib[zPos++] = (blockLen >> 8) & 0xff;
      zlib[zPos++] = (~blockLen) & 0xff;
      zlib[zPos++] = ((~blockLen) >> 8) & 0xff;
      zlib.set(raw.subarray(off, off + blockLen), zPos);
      zPos += blockLen;
      off += blockLen;
    } while (off < raw.length);
    const a = adler32(raw);
    zlib[zPos++] = (a >>> 24) & 0xff;
    zlib[zPos++] = (a >>> 16) & 0xff;
    zlib[zPos++] = (a >>> 8) & 0xff;
    zlib[zPos++] = a & 0xff;

    // Assemble PNG = signature + IHDR + IDAT + IEND.
    const ihdrLen = 13;
    const totalLen = 8 + (4 + 4 + ihdrLen + 4) + (4 + 4 + zlib.length + 4) + (4 + 4 + 0 + 4);
    const png = new Uint8Array(totalLen);
    let p = 0;
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) png[p++] = sig[i];

    const writeChunk = (type: string, data: Uint8Array): void => {
      png[p++] = (data.length >>> 24) & 0xff;
      png[p++] = (data.length >>> 16) & 0xff;
      png[p++] = (data.length >>> 8) & 0xff;
      png[p++] = data.length & 0xff;
      const typeStart = p;
      png[p++] = type.charCodeAt(0);
      png[p++] = type.charCodeAt(1);
      png[p++] = type.charCodeAt(2);
      png[p++] = type.charCodeAt(3);
      png.set(data, p);
      p += data.length;
      const crc = crc32(png, typeStart, p);
      png[p++] = (crc >>> 24) & 0xff;
      png[p++] = (crc >>> 16) & 0xff;
      png[p++] = (crc >>> 8) & 0xff;
      png[p++] = crc & 0xff;
    };

    const ihdr = new Uint8Array(13);
    ihdr[0] = (this.width >>> 24) & 0xff;
    ihdr[1] = (this.width >>> 16) & 0xff;
    ihdr[2] = (this.width >>> 8) & 0xff;
    ihdr[3] = this.width & 0xff;
    ihdr[4] = (this.height >>> 24) & 0xff;
    ihdr[5] = (this.height >>> 16) & 0xff;
    ihdr[6] = (this.height >>> 8) & 0xff;
    ihdr[7] = this.height & 0xff;
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // color type: truecolor RGB
    ihdr[10] = 0; // compression: deflate
    ihdr[11] = 0; // filter: standard
    ihdr[12] = 0; // interlace: none
    writeChunk('IHDR', ihdr);
    writeChunk('IDAT', zlib);
    writeChunk('IEND', new Uint8Array(0));

    return bytesToBase64(png);
  }
}

// ID card — light blue with navy header/footer, photo placeholder + field lines.
function buildIdCardPng(): string {
  const c = new PixelCanvas(320, 200);
  c.fill(220, 233, 245);                              // light blue background
  c.rect(0, 0, 320, 36, 30, 58, 95);                  // navy header band
  c.rect(8, 8, 80, 20, 30, 58, 95);                   // (header subtle accent — same color)
  c.rect(20, 50, 80, 100, 235, 235, 235);             // photo frame
  c.rect(24, 54, 72, 92, 200, 200, 200);              // photo inner gray
  c.rect(36, 70, 48, 16, 170, 170, 170);              // photo "head"
  c.rect(28, 92, 64, 36, 170, 170, 170);              // photo "shoulders"
  // Field lines on the right
  for (let i = 0; i < 5; i++) {
    c.rect(120, 55 + i * 22, 180, 6, 90, 90, 90);
    c.rect(120, 65 + i * 22, 140, 4, 170, 170, 170);
  }
  c.rect(0, 178, 320, 22, 30, 58, 95);                // footer
  // Tricolor accent (pan-Slavic colors stripes on right edge)
  c.rect(310, 36, 10, 47, 200, 30, 30);
  c.rect(310, 83, 10, 47, 30, 60, 130);
  c.rect(310, 130, 10, 48, 240, 240, 240);
  return c.toPngBase64();
}

// Passport — burgundy with a gold seal and an MRZ-looking footer.
function buildPassportPng(): string {
  const c = new PixelCanvas(280, 360);
  c.fill(92, 31, 44);                                 // burgundy bg
  // Title bands
  c.rect(20, 40, 240, 6, 220, 190, 100);
  c.rect(40, 56, 200, 4, 220, 190, 100);
  // Gold seal (concentric squares as a stand-in)
  c.rect(110, 90, 60, 60, 220, 190, 100);
  c.rect(118, 98, 44, 44, 92, 31, 44);
  c.rect(126, 106, 28, 28, 220, 190, 100);
  c.rect(132, 112, 16, 16, 92, 31, 44);
  // "Photo" + holder area
  c.rect(40, 175, 90, 110, 235, 235, 235);
  c.rect(44, 179, 82, 102, 200, 200, 200);
  c.rect(58, 195, 54, 18, 170, 170, 170);
  c.rect(48, 220, 74, 40, 170, 170, 170);
  // Field lines next to photo
  for (let i = 0; i < 5; i++) {
    c.rect(140, 180 + i * 22, 110, 5, 220, 190, 100);
    c.rect(140, 190 + i * 22, 90, 3, 200, 170, 90);
  }
  // MRZ
  c.rect(0, 305, 280, 55, 50, 18, 26);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 32; col++) {
      c.rect(10 + col * 8, 318 + row * 16, 6, 8, 220, 220, 220);
    }
  }
  return c.toPngBase64();
}

// Generic document — cream with text-like horizontal lines.
function buildGenericDocPng(): string {
  const c = new PixelCanvas(320, 200);
  c.fill(245, 240, 232);                              // cream paper
  // Border
  c.rect(0, 0, 320, 4, 200, 195, 180);
  c.rect(0, 196, 320, 4, 200, 195, 180);
  c.rect(0, 0, 4, 200, 200, 195, 180);
  c.rect(316, 0, 4, 200, 200, 195, 180);
  // Header line (longer, darker)
  c.rect(20, 24, 200, 8, 100, 90, 80);
  c.rect(20, 38, 120, 4, 160, 150, 140);
  // Body lines
  for (let i = 0; i < 7; i++) {
    c.rect(20, 60 + i * 16, 280, 4, 170, 165, 155);
  }
  return c.toPngBase64();
}

// ────────────────────────────────────────────────────────────────────────────
// Word (RTF) and plain-text templates — meaningful Serbian legal skeletons that
// the user can open in Word / Pages / LibreOffice / any text editor.
// ────────────────────────────────────────────────────────────────────────────

type TemplateVariant =
  | 'ugovor' | 'zalba' | 'tuzba' | 'punomocje'
  | 'predlog' | 'odluka' | 'odgovor' | 'beleske' | 'generic';

interface TextTemplate {
  title: string;
  paragraphs: string[]; // body paragraphs (use "" for a blank line spacer)
}

const WORD_TEMPLATES: Record<TemplateVariant, TextTemplate> = {
  ugovor: {
    title: "UGOVOR O ZASTUPANJU",
    paragraphs: [
      "Zakljucen dana ___________ godine, izmedju:",
      "1. Vlastodavac: ______________________________ (ime i prezime / naziv firme), JMBG/MB ___________________, sa prebivalistem/sedistem u ___________________, ulica ___________________, broj ___,",
      "i",
      "2. Punomocnik: Marko Petrovic, advokat, sa sedistem u Beogradu, ulica ___________________ broj ___, upisan u Imenik advokata Advokatske komore Beograda pod brojem ___________.",
      "",
      "Clan 1. Predmet ugovora",
      "Punomocnik se obavezuje da zastupa Vlastodavca u postupku ___________________ koji se vodi pred ___________________, pod brojem ___________.",
      "",
      "Clan 2. Obaveze punomocnika",
      "Punomocnik je duzan da: (a) preduzima sve potrebne pravne radnje radi zastite interesa Vlastodavca; (b) blagovremeno obavestava Vlastodavca o toku postupka; (c) cuva poslovnu tajnu i postuje pravila advokatske etike.",
      "",
      "Clan 3. Naknada",
      "Vlastodavac se obavezuje da Punomocniku plati naknadu prema vazecoj advokatskoj tarifi, odnosno prema pojedinacnoj fakturi koja ce biti izdata po izvrsenoj radnji. Naknada se moze ugovoriti i u pausalnom iznosu od ___________ RSD mesecno.",
      "",
      "Clan 4. Trajanje i raskid",
      "Ugovor stupa na snagu danom potpisivanja i traje do okoncanja predmeta. Svaka ugovorna strana moze otkazati ugovor pisanim putem, uz postovanje obaveza koje su do tada nastale.",
      "",
      "Clan 5. Zavrsne odredbe",
      "Sve sporove iz ovog ugovora ugovorne strane resice sporazumno, a u suprotnom je nadlezan sud u Beogradu. Ugovor je sacinjen u dva (2) istovetna primerka, po jedan za svaku ugovornu stranu.",
      "",
      "Vlastodavac:                                              Punomocnik:",
      "_______________________                                   _______________________",
    ],
  },
  zalba: {
    title: "ZALBA NA PRESUDU",
    paragraphs: [
      "VISEM SUDU U ___________________",
      "putem prvostepenog ___________________ suda u ___________________",
      "",
      "Predmet: Zalba na presudu broj ___________ od ___________ godine.",
      "Zalilac: ___________________ (ime i prezime), JMBG ___________________, koga zastupa advokat Marko Petrovic.",
      "",
      "I  Razlozi za zalbu",
      "Pobija se navedena presuda u celosti, zbog:",
      "- bitne povrede odredaba parnicnog/krivicnog postupka (clan ___),",
      "- pogresno i nepotpuno utvrdjenog cinjenicnog stanja,",
      "- pogresne primene materijalnog prava,",
      "- odluke o krivicnoj sankciji / visini dosudjenog iznosa.",
      "",
      "II  Cinjenice",
      "Sud prvog stepena nije pravilno cenio sledece dokaze: ___________________. Pored toga, predlog odbrane/tuzioca da se izvedu dokazi ___________________ je odbijen bez valjanog obrazlozenja, sto je dovelo do pogresnog zakljucka.",
      "",
      "III  Predlog",
      "Predlazem da Visi sud u ___________________ usvoji ovu zalbu, ukine pobijanu presudu i predmet vrati prvostepenom sudu na ponovno odlucivanje, ili da je preinaci tako sto ce: ___________________.",
      "",
      "IV  Trosak postupka",
      "Trazi se naknada troskova zalbenog postupka prema advokatskoj tarifi, sto ce biti specifikovano u troskovniku.",
      "",
      "U ___________________, dana ___________ godine.",
      "                                                          Punomocnik zalioca:",
      "                                                          _______________________",
    ],
  },
  tuzba: {
    title: "TUZBA",
    paragraphs: [
      "OPSTINSKOM/OSNOVNOM SUDU U ___________________",
      "",
      "Tuzilac: ______________________________, JMBG/MB ___________________, sa prebivalistem/sedistem u ___________________, ulica ___________________, broj ___, koga zastupa advokat Marko Petrovic.",
      "Tuzeni: ______________________________, sa adresom ___________________.",
      "Vrednost spora: ___________ RSD",
      "Predmet: ___________________",
      "",
      "I  Cinjenicno stanje",
      "Dana ___________ godine doslo je do ___________________. Tom prilikom je tuziocu naneta steta u iznosu od ___________ RSD, koja se sastoji u: ___________________.",
      "Tuzeni je pozvan da dobrovoljno izmiri obavezu, ali do dana podnosenja ove tuzbe to nije ucinio.",
      "",
      "II  Pravni osnov",
      "Pravni osnov za isticanje ovog tuzbenog zahteva nalazi se u clanu ___ Zakona o ___________________, kao i u opstim pravilima o naknadi stete iz Zakona o obligacionim odnosima.",
      "",
      "III  Dokazni predlog",
      "Predlazem da sud izvede sledece dokaze: (a) saslusanje stranaka i svedoka; (b) uvid u prilozenu dokumentaciju (ugovor, fakture, dopise); (c) vestacenje po vestaku odgovarajuce struke.",
      "",
      "IV  Tuzbeni zahtev",
      "Predlazem da sud, posle odrzanog rocista, donese sledecu",
      "PRESUDU",
      "Tuzeni se obavezuje da tuziocu isplati iznos od ___________ RSD sa zakonskom zateznom kamatom od ___________ godine do konacne isplate, kao i da naknadi troskove parnicnog postupka, sve u roku od 15 dana od pravnosnaznosti presude.",
      "",
      "U ___________________, dana ___________ godine.",
      "                                                          Punomocnik tuzioca:",
      "                                                          _______________________",
    ],
  },
  punomocje: {
    title: "PUNOMOCJE",
    paragraphs: [
      "Ja, dole potpisani Vlastodavac:",
      "Ime i prezime: ______________________________",
      "JMBG: ___________________",
      "Adresa: ______________________________",
      "",
      "ovim aktom dajem PUNOMOCJE",
      "",
      "advokatu Marku Petrovicu, sa sedistem u Beogradu, upisanom u Imenik advokata Advokatske komore Beograda pod brojem ___________, da me zastupa pred svim sudovima, drzavnim organima, javnim beleznicima i drugim pravnim licima u svim postupcima koji se ticu sledeceg pravnog posla:",
      "______________________________",
      "______________________________",
      "",
      "Punomocnik je ovlascen da:",
      "- preduzima sve pravne radnje, ukljucujuci podnosenje podnesaka i prijem pismena;",
      "- prisustvuje rocistima i daje izjave u moje ime;",
      "- zakljucuje sudska i vansudska poravnanja;",
      "- prima novcane iznose dosudjene u postupku;",
      "- po potrebi vrsi supstituciju drugim advokatom iz iste advokatske kancelarije.",
      "",
      "Ovo punomocje vazi do opoziva, koji moram dostaviti u pisanoj formi.",
      "",
      "U ___________________, dana ___________ godine.",
      "",
      "                                                          Vlastodavac:",
      "                                                          _______________________",
      "",
      "Overa potpisa kod javnog beleznika.",
    ],
  },
  predlog: {
    title: "PREDLOG ZA ___________________",
    paragraphs: [
      "___________________ SUDU U ___________________",
      "",
      "Predlagac: ______________________________, JMBG/MB ___________________, koga zastupa advokat Marko Petrovic.",
      "Protivnik predlagaca: ______________________________.",
      "",
      "Na osnovu clana ___ Zakona o ___________________, podnosim sledeci",
      "",
      "PREDLOG",
      "",
      "kojim trazim da sud, posle sprovedenog postupka, donese resenje kojim ce: ___________________.",
      "",
      "Obrazlozenje",
      "Iz prilozenih dokaza proizlazi da su ispunjeni svi zakonski uslovi za usvajanje predloga, jer ___________________.",
      "",
      "Dokazi:",
      "1. ______________________________",
      "2. ______________________________",
      "3. ______________________________",
      "",
      "Predlazem da sud, na osnovu cinjenicnog stanja i izvedenih dokaza, usvoji predlog kao osnovan i donese odluku u skladu sa zakonom.",
      "",
      "U ___________________, dana ___________ godine.",
      "                                                          Predlagac (po punomocniku):",
      "                                                          _______________________",
    ],
  },
  odluka: {
    title: "ODLUKA",
    paragraphs: [
      "Na osnovu clana ___ Zakona o ___________________ i clana ___ Statuta drustva, ___________________ (organ koji donosi odluku), na sednici odrzanoj dana ___________ godine, donosi sledecu",
      "",
      "ODLUKU",
      "",
      "1. Usvaja se ___________________.",
      "2. Zaduzuje se ___________________ da preduzme sve potrebne radnje radi sprovodjenja ove odluke u roku od ___ dana od dana donosenja.",
      "3. Odluka stupa na snagu danom donosenja i objavljuje se na nacin propisan opstim aktima.",
      "",
      "Obrazlozenje",
      "Razlozi za donosenje ove odluke su: ___________________. Prilozi koji su razmotreni: ___________________.",
      "",
      "Pouka o pravnom leku: Protiv ove odluke moze se izjaviti prigovor/zalba u roku od ___ dana od dana prijema, putem ___________________.",
      "",
      "U ___________________, dana ___________ godine.",
      "                                                          Predsednik / Direktor:",
      "                                                          _______________________",
    ],
  },
  odgovor: {
    title: "ODGOVOR NA TUZBU",
    paragraphs: [
      "OPSTINSKOM/OSNOVNOM SUDU U ___________________",
      "Predmet: P ___________ / ___________",
      "",
      "Tuzeni: ______________________________, JMBG/MB ___________________, koga zastupa advokat Marko Petrovic.",
      "Tuzilac: ______________________________.",
      "",
      "U zakonskom roku, dostavljam sledeci ODGOVOR NA TUZBU:",
      "",
      "I  Procesni prigovori",
      "Isticem prigovor: ___________________ (npr. nedostatak aktivne legitimacije / zastarelost / nenadleznost suda).",
      "",
      "II  Osvrt na tuzbene navode",
      "U pogledu cinjenicnih navoda iz tuzbe izjavljujem sledece: ___________________. Tvrdnja tuzioca da ___________________ je netacna, jer ___________________.",
      "",
      "III  Pravni stav",
      "Smatram da nisu ispunjeni uslovi za usvajanje tuzbenog zahteva, jer ___________________ (pravna analiza, pozivanje na clanove zakona).",
      "",
      "IV  Dokazni predlog",
      "Predlazem da sud izvede sledece dokaze odbrane: ___________________.",
      "",
      "V  Predlog",
      "Predlazem da sud tuzbu odbije kao neosnovanu i obaveze tuzioca da tuzenom naknadi troskove parnicnog postupka prema advokatskoj tarifi.",
      "",
      "U ___________________, dana ___________ godine.",
      "                                                          Punomocnik tuzenog:",
      "                                                          _______________________",
    ],
  },
  beleske: {
    title: "BELESKE ZA PRIPREMU ROCISTA",
    paragraphs: [
      "Predmet: ___________________",
      "Sud / sudija: ___________________",
      "Datum rocista: ___________ u ___:___ casova",
      "",
      "1. Cilj rocista",
      "- Sta zelimo da postignemo (npr. saslusanje svedoka, utvrdjenje cinjenica, predlog poravnanja).",
      "",
      "2. Kljucne cinjenice",
      "- _____________________________________________",
      "- _____________________________________________",
      "- _____________________________________________",
      "",
      "3. Dokazi koje cemo isticati",
      "- _____________________________________________",
      "- _____________________________________________",
      "",
      "4. Pitanja za svedoke",
      "Svedok 1: __________________________",
      "  - _____________________________________________",
      "  - _____________________________________________",
      "Svedok 2: __________________________",
      "  - _____________________________________________",
      "",
      "5. Ocekivani prigovori protivne strane i odgovori",
      "- Prigovor: ___________________  →  Odgovor: ___________________",
      "- Prigovor: ___________________  →  Odgovor: ___________________",
      "",
      "6. Obaveze nakon rocista",
      "- _____________________________________________",
      "- _____________________________________________",
    ],
  },
  generic: {
    title: "MOCK TEMPLATE",
    paragraphs: [
      "Ovo je primer mock template dokumenta generisanog iskljucivo radi demonstracije.",
      "",
      "U produkciji bi ovde bio sablon koji odgovara izabranoj kategoriji (Ugovor, Zalba, Tuzba, Punomocje, Predlog, Odluka, Odgovor, ...).",
      "",
      "Korisnik moze otvoriti fajl u Word-u / Pages-u / LibreOffice-u, popuniti praznine i sacuvati kao novi dokument za konkretan predmet.",
    ],
  },
};

// RTF builder ─ wraps the same title + paragraphs structure into a minimal but
// fully valid Rich Text Format document. RTF special chars (\, {, }) are escaped.
function rtfEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}

function buildRtf(title: string, paragraphs: string[]): string {
  let out = "{\\rtf1\\ansi\\ansicpg1250\\deff0";
  out += "{\\fonttbl{\\f0 Times New Roman;}}";
  out += "\\viewkind4\\uc1\\pard\\sa120 ";
  // Title
  out += "\\f0\\b\\fs32 " + rtfEscape(title) + "\\b0\\par\\par ";
  // Body paragraphs (12pt)
  out += "\\fs24 ";
  for (const p of paragraphs) {
    if (p === "") {
      out += "\\par ";
    } else {
      out += rtfEscape(p) + "\\par ";
    }
  }
  out += "}";
  return out;
}

function buildPlainText(title: string, paragraphs: string[]): string {
  const underline = "=".repeat(Math.max(8, title.length));
  return [title, underline, "", ...paragraphs].join("\n") + "\n";
}

// Pick a template variant from the hint (typically `<category> <name>`).
export function pickTemplateVariantFromHint(hint: string): TemplateVariant {
  const h = hint.toLowerCase();
  if (h.includes("punomoc")) return "punomocje";
  if (h.includes("zalba") || h.includes("žalba") || h.includes("appeal")) return "zalba";
  if (h.includes("tuzba") || h.includes("tužba") || h.includes("lawsuit")) return "tuzba";
  if (h.includes("ugovor") || h.includes("contract")) return "ugovor";
  if (h.includes("predlog") || h.includes("motion")) return "predlog";
  if (h.includes("odluka") || h.includes("decision")) return "odluka";
  if (h.includes("odgovor") || h.includes("response")) return "odgovor";
  if (h.includes("belesk") || h.includes("notes") || h.includes("rocist")) return "beleske";
  return "generic";
}

type ImageVariant = 'id-card' | 'passport' | 'generic';

const IMAGE_BUILDERS: Record<ImageVariant, () => string> = {
  'id-card': buildIdCardPng,
  passport: buildPassportPng,
  generic: buildGenericDocPng,
};

// ────────────────────────────────────────────────────────────────────────────
// Cache plumbing
// ────────────────────────────────────────────────────────────────────────────

const cacheDir = (FileSystem.cacheDirectory ?? '') + 'mock-docs/';

const pdfUriPromises: Map<PdfVariant, Promise<string>> = new Map();
const imageUriPromises: Map<ImageVariant, Promise<string>> = new Map();
const textUriPromises: Map<TemplateVariant, Promise<string>> = new Map();
const wordUriPromises: Map<TemplateVariant, Promise<string>> = new Map();

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(cacheDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
  }
}

async function writeOnce(filename: string, content: string, encoding: FileSystem.EncodingType): Promise<string> {
  await ensureCacheDir();
  const uri = cacheDir + filename;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(uri, content, { encoding });
  }
  return uri;
}

export function getMockPdfUri(variant: PdfVariant = 'generic'): Promise<string> {
  let p = pdfUriPromises.get(variant);
  if (!p) {
    const tpl = PDF_TEMPLATES[variant];
    p = writeOnce(`mock-${variant}.pdf`, buildPdf(tpl.title, tpl.paragraphs), FileSystem.EncodingType.Base64);
    pdfUriPromises.set(variant, p);
  }
  return p;
}

export function getMockImageUri(variant: ImageVariant = 'generic'): Promise<string> {
  let p = imageUriPromises.get(variant);
  if (!p) {
    p = writeOnce(`mock-${variant}.png`, IMAGE_BUILDERS[variant](), FileSystem.EncodingType.Base64);
    imageUriPromises.set(variant, p);
  }
  return p;
}

// Pick an image variant from a free-form hint (typically the doc's domain type
// + name): "id-card" / "passport" map to those variants; everything else falls
// back to the generic doc-page render.
export function pickImageVariantFromHint(hint: string): ImageVariant {
  const h = hint.toLowerCase();
  if (h.includes('id-card') || h.includes('licna karta') || h.includes('lična karta')) return 'id-card';
  if (h.includes('passport') || h.includes('pasos') || h.includes('пасош')) return 'passport';
  return 'generic';
}

export function getMockTextUri(variant: TemplateVariant = 'generic'): Promise<string> {
  let p = textUriPromises.get(variant);
  if (!p) {
    const tpl = WORD_TEMPLATES[variant];
    p = writeOnce(`mock-${variant}.txt`, buildPlainText(tpl.title, tpl.paragraphs), FileSystem.EncodingType.UTF8);
    textUriPromises.set(variant, p);
  }
  return p;
}

export function getMockWordUri(variant: TemplateVariant = 'generic'): Promise<string> {
  let p = wordUriPromises.get(variant);
  if (!p) {
    // .rtf is universally openable by Word / Pages / LibreOffice — perfect mock
    // stand-in for a Word document with proper formatting.
    const tpl = WORD_TEMPLATES[variant];
    p = writeOnce(`mock-${variant}.rtf`, buildRtf(tpl.title, tpl.paragraphs), FileSystem.EncodingType.UTF8);
    wordUriPromises.set(variant, p);
  }
  return p;
}

// Pick a meaningful PDF template from a free-form hint string. The hint is
// usually the doc name and/or category — we just grep it for keywords.
export function pickPdfVariantFromHint(hint: string): PdfVariant {
  const h = hint.toLowerCase();
  if (h.includes("punomoc") || h.includes("power-of-attorney") || h.includes("engagement")) return "punomocje";
  if (h.includes("tuzba") || h.includes("tužba") || h.includes("pleadings")) return "tuzba";
  if (h.includes("ugovor") || h.includes("contract")) return "ugovor";
  if (h.includes("presud") || h.includes("court-decisions")) return "presuda";
  if (h.includes("zapisnik")) return "zapisnik";
  if (h.includes("krivicna") || h.includes("krivična")) return "krivicnaPrijava";
  if (h.includes("izjava") || h.includes("svedok")) return "izjavaSvedoka";
  if (h.includes("izvod") || h.includes("maticn")) return "izvod";
  if (h.includes("osnivac") || h.includes("osnivač") || h.includes("formation")) return "osnivacki";
  if (h.includes("zalba") || h.includes("žalba")) return "zalba";
  if (h.includes("odluka")) return "odluka";
  if (h.includes("sporazum") && h.includes("razvod")) return "sporazumRazvod";
  if (h.includes("apr") || h.includes("correspondence")) return "odluka";
  return "generic";
}

// Returns a real, openable URI for any document whose URI looks like a mock
// placeholder (`file:///mock/...`). Falls through unchanged for real URIs that
// the user added via the upload / capture flows. `hint` is used to pick a
// meaningful PDF template (see pickPdfVariantFromHint).
export async function resolveMockUri(
  uri: string,
  type: 'pdf' | 'image' | 'word' | 'text' | 'other',
  hint = '',
): Promise<string> {
  if (!uri.startsWith('file:///mock/')) return uri;
  switch (type) {
    case 'pdf': return getMockPdfUri(pickPdfVariantFromHint(hint));
    case 'image': return getMockImageUri(pickImageVariantFromHint(hint));
    case 'word': return getMockWordUri(pickTemplateVariantFromHint(hint));
    case 'text': return getMockTextUri(pickTemplateVariantFromHint(hint));
    default: return getMockTextUri(pickTemplateVariantFromHint(hint));
  }
}
