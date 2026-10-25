// Content from the brand's Instagram (@pov.maisonmalola). Captions are theirs, lightly trimmed.
export const WHATSAPP = '916282771001';

export const SCENTS = [
  { n: '01', name: 'All Eyes On Me', label: ['All', 'Eyes', 'On Me'], line: 'The second the conversation pauses.', note: 'Saffron' },
  { n: '02', name: 'All Over You', label: ['All', 'Over', 'You'], line: 'What the chair holds after you stand up.', note: 'Jasmin' },
  { n: '03', name: 'Under My Spell', label: ['Under', 'My', 'Spell'], line: 'The part they remember without knowing why.', note: 'Cedar' },
];

export const FRAMES = [
  { img: 'orange-card', post: 'DdgtQgrIWb5', text: 'The object didn’t move. Your focus did.' },
  { img: 'stamp', post: 'DZxRnDkzNW-', text: 'POV: — 01. A scent, framed like memory. Held close. Collected slowly.' },
  { img: 'trio', post: 'DYKSXcnk9dH', text: 'Three bottles. One room. You choose who walks in.' },
  { img: 'puzzle', post: 'Da5FzEBzOmP', text: 'Everything fit. Something was still missing. A presence you could feel.' },
  { img: 'three-squares', post: 'DZKqyvGIqmA', text: 'A scent isn’t just applied. It is wielded.' },
  { img: 'phone', post: 'DX4SXbPE6qc', text: 'Pick up… POV: is on the line. Maison Malola. Now answering.' },
  { img: 'shadow', post: 'DYCiBjazHrd', text: '11PM. The hall has emptied. You haven’t left yet.' },
  { img: 'two-caps', post: 'DZDr18Tk02Q', text: 'You enter through the warm light. Then the room turns darker.' },
  { img: 'manifesto', post: 'DYPiNX2TWAH', text: 'POV: is not a perfume. It is a point of view, carried through scent.' },
];

export const waLink = (scent) =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi Maison Malola — I'd like to order ${scent} (50 ml).`)}`;
