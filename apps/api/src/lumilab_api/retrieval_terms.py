"""Versioned lexical vocabulary; never translates answers or changes source text."""
import re
import unicodedata

PROFILE = 'vi-en-science-v3'
# Phrase equivalences are general domain vocabulary, not case IDs or answer labels.
ALIASES = {
    # Keep compound meanings intact: 'công thức' must not match 'thực vật',
    # and exercise scaffolding ('câu hỏi') is not a subject-matter keyword.
    'formula': ('cong thuc', 'formula', 'formulas'),
    'assumption': ('gia thiet', 'assumption', 'assumptions'),
    'acceleration': ('gia toc', 'acceleration'),
    'period': ('chu ky', 'period', 'periods'),
    'mass': ('khoi luong', 'mass', 'masses'),
    'length': ('chieu dai', 'day dai', 'string length', 'length'),
    'amplitude': ('bien do', 'goc tha', 'release angle', 'amplitude'),
    'pendulum': ('con lac', 'pendulum'),
    'nonlinear': ('phi tuyen', 'nonlinear', 'non linear'),
    'ammeter': ('ampe ke', 'ammeter'),
    'voltmeter': ('von ke', 'voltmeter'),
    'resistance': ('dien tro', 'resistance', 'resistor', 'resistors'),
    'voltage': ('hieu dien the', 'dien ap', 'voltage'),
    'current': ('dong dien', 'current'),
    'series': ('noi tiep', 'series'),
    'parallel': ('song song', 'parallel'),
    'open': ('mach ho', 'cong tac mo', 'mo cong tac', 'open circuit', 'open switch', 'open'),
    'load': ('load', 'loads'),
    'equivalence': ('diem tuong duong', 'tuong duong', 'equivalence point', 'equivalence'),
    'endpoint': ('diem ket thuc', 'endpoint', 'end point'),
    'indicator': ('chat chi thi', 'chi thi', 'indicator'),
    'acid': ('axit', 'acid', 'acids'),
    'base': ('bazo', 'baze', 'base', 'bases'),
    'concentration': ('nong do', 'concentration'),
    'drop': ('giot', 'drop', 'drops'),
    'force': ('hop luc', 'luc', 'net force', 'force'),
    'pulley': ('rong roc', 'pulley', 'pulleys'),
    'precipitate': ('ket tua', 'precipitate', 'precipitation'),
    'limiting': ('chat gioi han', 'limiting reagent', 'limiting reactant'),
    'gas': ('chat khi', 'khi sinh ra', 'gas'),
}
STOP = set(('la va cua thi khi voi nhung mot cac cho minh ban em nay do sao vi gi '
    'co khong the nao phai duoc de hay neu se van nhu bang tai '
    'tang giam hon doi thay thi ngay mai '
    'how why what which does do is are was were the a an and or of to through there '
    'in on at for by as be should would can could when with that this it its '
    'affect affects change changes required same near than then').split())


def plain(text):
    text = unicodedata.normalize('NFKC', text).casefold().replace('đ', 'd')
    text = ''.join(c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) not in {'Mn', 'Cf'})
    return ' '.join(re.findall(r'[a-z0-9]+', text))


PHRASES = sorted(((phrase, concept) for concept, phrases in ALIASES.items()
    for phrase in set(phrases)), key=lambda row: -len(row[0]))
PATTERN = re.compile(r'\b(?:' + '|'.join(re.escape(p) for p, _ in PHRASES) + r')\b')
CANONICAL = dict(PHRASES)


def words(text):
    text = plain(text)
    text = re.sub(r'\bcau hoi\b', ' ', text)
    text = PATTERN.sub(lambda m: ' concept' + CANONICAL[m.group()] + ' ', text)
    return [t for t in text.split() if t not in STOP]
