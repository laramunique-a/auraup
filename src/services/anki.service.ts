/**
 * Anki Service — Handles .apkg import/export locally in the browser.
 * Now restored to "Perfect Local Quality" (Language v7 + Full Image support).
 */

import { saveAs } from 'file-saver';
import { supabase, lsGet, lsSetItem } from './storage';
import type { Card, Deck } from '../types';
import { unzipSync } from 'fflate';
import initSqlJs from 'sql.js';
import { decompress } from 'fzstd';

// @ts-ignore
import * as genanki from 'genanki-js';

/**
 * Robust binary to Base64 conversion to avoid stack overflow.
 */
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
  }
  return window.btoa(binary);
}

/**
 * Ported logic from the backend to process .apkg archives locally.
 */
export async function importAnkiApkg(file: File, name?: string): Promise<{ 
  success: boolean; 
  message: string; 
  deck_id?: string;
  cards?: any[];
  deck_name?: string;
}> {
  console.log('🚀 Iniciando importação local de alta qualidade (WASM)...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    const unzipped = unzipSync(data);
    let deckName = name || file.name.replace(/\.apkg(\.zip)?$/i, '');
    
    let zipEntries = unzipped;
    const apkgFile = Object.keys(unzipped).find(n => n.endsWith('.apkg'));
    if (apkgFile) {
      zipEntries = unzipSync(unzipped[apkgFile]);
    }

    const collectionKey = Object.keys(zipEntries).find(k => k.startsWith('collection.anki2'));
    const mediaKey = Object.keys(zipEntries).find(k => k === 'media');

    if (!collectionKey) throw new Error('Banco de dados do Anki não encontrado.');

    let collectionData = zipEntries[collectionKey];
    if (collectionKey.endsWith('b')) collectionData = decompress(collectionData);

    let mediaData = zipEntries[mediaKey || ''];

    // --- 1. Robust Media Map Parser (Support both JSON and Binary) ---
    let mediaMap: Record<string, string> = {};
    if (mediaData) {
      if (mediaData[0] === 0x28 && mediaData[1] === 0xB5) mediaData = decompress(mediaData);
      
      try {
        mediaMap = JSON.parse(new TextDecoder().decode(mediaData));
      } catch (e) {
        console.log('🔍 Detectado formato binário no mapa de mídia. Traduzindo...');
        const binaryMap: Record<string, string> = {};
        let i = 0;
        let entryCount = 0;
        while (i < mediaData.length) {
          if (mediaData[i] === 0x0a) {
            i++;
            let entryLen = 0, shift = 0;
            while (i < mediaData.length && (mediaData[i] & 0x80)) {
              entryLen |= (mediaData[i] & 0x7f) << shift; shift += 7; i++;
            }
            if (i < mediaData.length) entryLen |= (mediaData[i] & 0x7f) << shift; i++;
            const entryEnd = i + entryLen;
            let filename = '';
            while (i < entryEnd) {
              const tag = mediaData[i++];
              let lenOrVal = 0, s = 0;
              while (i < mediaData.length && (mediaData[i] & 0x80)) {
                lenOrVal |= (mediaData[i] & 0x7f) << s; s += 7; i++;
              }
              if (i < mediaData.length) lenOrVal |= (mediaData[i] & 0x7f) << s; i++;
              if (tag === 0x0a) {
                filename = new TextDecoder().decode(mediaData.slice(i, i + lenOrVal));
                i += lenOrVal;
              } else if ((tag & 0x7) === 2) i += lenOrVal;
            }
            if (filename) {
              binaryMap[entryCount.toString()] = filename;
              entryCount++;
            }
          } else i++;
        }
        mediaMap = binaryMap;
      }
    }

    const reverseMediaMap: Record<string, string> = {};
    Object.entries(mediaMap).forEach(([id, filename]) => {
      reverseMediaMap[filename] = id;
    });

    // --- 2. SQL Extraction ---
    const SQL = await initSqlJs({ locateFile: () => `/sql-wasm.wasm` });
    const db = new SQL.Database(collectionData);
    const results = db.exec("SELECT flds FROM notes");
    const rows = results[0]?.values || [];

    const parsedCards = rows.map((fieldsRow: any) => {
      const flds = fieldsRow[0] || '';
      const fields = flds.split('\x1f');
      const frontRaw = fields[0] || '';
      const backRaw = fields[1] || '';

      const extractImage = (html: string) => {
        try {
          const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
          if (!imgMatch) return null;
          const filename = imgMatch[1];
          const zipId = reverseMediaMap[filename];
          if (!zipId) return null;

          let imgData = zipEntries[zipId];
          if (!imgData) return null;
          if (imgData[0] === 0x28 && imgData[1] === 0xB5) imgData = decompress(imgData);
          if (imgData.length > 5 * 1024 * 1024) return null;

          let mime = 'image/png';
          if (imgData[0] === 0xff && imgData[1] === 0xd8) mime = 'image/jpeg';
          else if (imgData[0] === 0x89 && imgData[1] === 0x50) mime = 'image/png';
          else if (imgData[0] === 0x47 && imgData[1] === 0x49) mime = 'image/gif';
          
          return `data:${mime};base64,${uint8ArrayToBase64(imgData)}`;
        } catch (e) { return null; }
      };

      const cleanText = (text: string) => {
        return text.replace(/\[sound:[^\]]+\]/g, '').replace(/&nbsp;/g, ' ').replace(/<[^>]*>?/gm, '').trim();
      };

      // --- 3. Full Language Detection v7 (Survival EN) ---
      const frontClean = cleanText(frontRaw);
      const backClean = cleanText(backRaw);

      const detectScore = (text: string) => {
        const clean = text.replace(/\([^)]*\)/g, '').toLowerCase().trim();
        if (!clean) return { en: 0, pt: 0 };
        let en = 0, pt = 0;
        if (/[áàâãéèêíïóòôõúùûç]/.test(clean)) pt += 15;
        const ptWords = /\b(de|do|da|que|em|um|para|com|não|uma|os|no|se|na|por|mais|as|como|mas|ao|ele|seu|sua|ou|quando|muito|já|eu|só|pelo|pela|até|mesmo|quem|me|esse|eles|você|essa|dar|foi|era|esta|está|ter|ser|o|a|dia|inteiro|semana|passado|tempo|clima|vida|adulta|conhecer|pessoa|minha|meu|falar|sobre|saber|ver|fazer|ir|querer|pode|poder|disse|dizer|antes|depois|pedir)\b/i;
        if (ptWords.test(clean)) pt += 7;
        const enWords = /\b(the|is|and|to|of|for|with|as|at|on|are|it|you|that|was|were|be|this|in|from|have|had|his|her|they|but|which|or|will|an|as|up|so|my|your|at|do|not|can|would|watch|watched|when|all|day|long|last|weekend|next|every|meet|welcome|friend|girl|boy|adulthood|life|adult|talk|about|know|see|make|go|want|could|said|say|order|pizza|before|after|please|thank|thanks|hello|hi|need|get)\b/i;
        if (enWords.test(clean)) en += 7;
        if (/\b(a|an)\b/i.test(clean) && !/[áàâãéèêíïóòôõúùûç]/.test(clean)) en += 4;
        if (/(ado|ada|ido|ida|ção|ções|mente|ar|er|ir)$/i.test(clean)) pt += 5;
        if (/(ing|ed|ly|tion|ness|ment|able|ible)$/i.test(clean)) en += 5;
        if (/^(the|i|we|you|they|my|your|welcome|this|it|order|before|after|a)\b/i.test(clean)) en += 6;
        return { en, pt };
      };

      const fScore = detectScore(frontClean);
      const bScore = detectScore(backClean);

      let fLang: 'en-US' | 'pt-BR' = (fScore.en > fScore.pt) ? 'en-US' : 'pt-BR';
      let bLang: 'en-US' | 'pt-BR' = (bScore.en > bScore.pt) ? 'en-US' : 'pt-BR';
      if (fLang === 'pt-BR' && bScore.pt < 10) bLang = 'en-US';
      if (fScore.en >= 7) fLang = 'en-US';
      if (bScore.en >= 7) bLang = 'en-US';

      return {
        front: frontClean,
        back: backClean,
        front_image: extractImage(frontRaw),
        back_image: extractImage(backRaw),
        front_lang: fLang,
        back_lang: bLang,
        front_audio: frontClean.length > 0 && fLang === 'en-US',
        back_audio: backClean.length > 0 && bLang === 'en-US'
      };
    });

    db.close();

    if (parsedCards.length === 0) throw new Error('Nenhum card encontrado.');

    // --- 4. Persistence with Audio Flags ---
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: deck, error: deckErr } = await supabase.from('decks').insert({ user_id: session.user.id, name: deckName }).select().single();
        if (deckErr) throw deckErr;

        const cardsToInsert = parsedCards.map(c => ({
          deck_id: deck.id,
          front: c.front,
          back: c.back,
          front_image: c.front_image,
          back_image: c.back_image,
          front_lang: c.front_lang,
          back_lang: c.back_lang,
          front_audio: c.front_audio,
          back_audio: c.back_audio
        }));

        const { error: cardsErr } = await supabase.from('cards').insert(cardsToInsert);
        if (cardsErr) throw cardsErr;

        return { success: true, message: `${parsedCards.length} cards importados!`, deck_id: deck.id, deck_name: deckName };
      }
    }

    // Local Persistence
    const decks = lsGet<Deck>('uply_decks');
    const newDeck: Deck = { id: crypto.randomUUID(), name: deckName, created_at: new Date().toISOString(), user_id: 'local' };
    lsSetItem('uply_decks', [...decks, newDeck]);
    const cards = lsGet<Card>('uply_cards');
    const newCards: Card[] = parsedCards.map(c => ({ ...c, id: crypto.randomUUID(), deck_id: newDeck.id, created_at: new Date().toISOString() }));
    lsSetItem('uply_cards', [...cards, ...newCards]);

    return { success: true, message: `${parsedCards.length} cards locais!`, cards: newCards, deck_name: deckName };

  } catch (err: any) {
    console.error('Anki Import Error:', err);
    throw new Error(`Falha na importação: ${err.message}`);
  }
}

/**
 * Exports a deck to .apkg (Client-side)
 */
export async function exportToAnki(deckName: string, cards: Card[]) {
  // @ts-ignore
  const { Package, Deck, Model, Note } = genanki;

  const model = new Model({
    name: 'Uply Card',
    id: '1607392319',
    flds: [{ name: 'Front', font: 'Arial' }, { name: 'Back', font: 'Arial' }],
    tmplts: [{ name: 'Card 1', qfmt: '{{Front}}', afmt: '{{Front}}<hr id="answer">{{Back}}' }]
  });

  const deck = new Deck(Math.floor(Math.random() * 1000000000), deckName);
  const pkg = new Package();

  for (const card of cards) {
    let frontContent = card.front;
    let backContent = card.back;
    if (card.front_image && !card.front_image.startsWith('data:')) frontContent += `<br><img src="${card.front_image}">`;
    if (card.back_image && !card.back_image.startsWith('data:')) backContent += `<br><img src="${card.back_image}">`;

    const note = new Note({ model, fields: [frontContent, backContent] });
    deck.addNote(note);
  }

  pkg.addDeck(deck);
  const content = await pkg.writeToFile();
  saveAs(content, `${deckName.replace(/\s+/g, '_')}.apkg`);
}

export const ankiService = { importFromApkg: importAnkiApkg, exportToAnki: exportToAnki };
