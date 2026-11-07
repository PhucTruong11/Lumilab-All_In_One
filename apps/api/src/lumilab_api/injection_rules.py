"""Contextual heuristics; signals do not grant tool access or academic approval."""
import base64
import binascii
import re
import unicodedata
from dataclasses import dataclass

REVISION = 'vi-injection-rules-v2-context'
PATTERNS = (
    r'(bo qua|bo het|phot lo|quen|huy|ignore|disregard|forget).{0,70}(chi dan|quy tac|huong dan|instructions|rules|system)',
    r'(tiet lo|in ra|hien thi|show|reveal|print).{0,45}(system prompt|prompt he thong|api.?key|khoa api|mat khau|secret)',
    r'(hay|phai|ghi|tra ve|danh dau|claim|return|mark).{0,35}(verified|da duyet|approved).{0,35}(du|bat chap|khong can|without|regardless)',
    r'(gia mao|bia|tu tao|fake|invent).{0,30}(nguon|trich dan|citation|source)',
    r'(chay|thuc thi|execute|run).{0,35}(shell|powershell|curl|rm -rf|lenh he thong)',
    r'(developer mode|do anything now|ban la dan|you are dan|<\|im_start\|>system)',
    r'(tin nhan|noi dung|yeu cau|this message).{0,45}(uu tien cao nhat|highest priority)',
    r'(rang buoc|quy tac|huong dan|restrictions).{0,45}(bi huy|vo hieu hoa|disabled|no longer apply)',
    r'(hay|phai|now|please).{0,25}(lam theo|thi hanh|thuc hien|follow|obey|execute).{0,45}(trong ngoac|cau tren|vi du|doan tren|quoted|example|quote)',
)
QUOTES = re.compile(r'```[\s\S]*?```|`[^`\n]+`|“[^”]*”|‘[^’]*’|"[^"\n]*"|\x27[^\x27\n]*\x27')
EDUCATION = re.compile(r'(an toan|prompt injection|jailbreak|vi du.{0,30}tan cong|'
    r'phan tich.{0,30}(cau|vi du)|trong log|co phai.{0,30}injection|security lesson)')
EXPLAIN = re.compile(r'(vi sao|giai thich|phan tich|la vi du|la mau|co phai|explain|example|why)')
NEGATED = re.compile(r'(?:dung|khong duoc|khong nen|do not|dont|never)\s*$')


def normalized(text):
    text = unicodedata.normalize('NFKC', text).casefold()
    text = ''.join(c for c in text if unicodedata.category(c) != 'Cf')
    text = ''.join(c for c in unicodedata.normalize('NFD', text) if not unicodedata.combining(c))
    text = text.replace('đ', 'd')
    # Join only long runs of separated letters; preserve ordinary words/sentences.
    text = re.sub(r'(?<!\w)(?:[a-z]\s+){3,}[a-z](?!\w)', lambda m: re.sub(r'\s+', '', m.group()), text)
    for compact, phrase in (
        ('boqua', 'bo qua'), ('chidan', 'chi dan'), ('photlo', 'phot lo'),
        ('ignorepreviousinstructions', 'ignore previous instructions')):
        text = text.replace(compact, phrase)
    return ' '.join(text.split())


def actionable(text):
    text = normalized(text)
    # Condemnation in reported speech is not an instruction to fabricate a source.
    # Remove only that span; an instruction later in the same sentence stays visible.
    text = re.sub(r'(?:thay|giao vien).{0,25}noi rang (?:bia nguon|gia mao trich dan) '
        r'la (?:hanh vi )?sai', '[reported disapproval]', text)
    for pattern in PATTERNS:
        for match in re.finditer(pattern, text):
            prefix = text[max(0,match.start()-25):match.start()]
            if not NEGATED.search(prefix):
                return True
    return False


@dataclass(frozen=True)
class Finding:
    blocked: bool
    reason: str = 'NONE'
    educational_quote: bool = False


def inspect(text):
    if len(text)>24000:
        return Finding(True, 'SCREENING_INPUT_LIMIT')
    original = text
    norm = normalized(original)
    educational = bool(EDUCATION.search(norm) and EXPLAIN.search(norm) and QUOTES.search(original))
    # Mask data quoted for explicit analysis. Outside commands are always inspected.
    outside = QUOTES.sub(' [quoted example] ', original) if educational else original
    # Line wrapping is not a sentence boundary: an override can span lines.
    clauses = re.split(r'[.;!?]+', outside)
    if any(actionable(clause) for clause in clauses):
        return Finding(True, 'OVERRIDE_OR_SECRET_OR_EXECUTION')
    # Decode a bounded number of candidate strings, never execute or pass decoded
    # instructions to a tool. Recursion is intentionally not supported.
    limited=False
    for token in re.findall(r'(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{24,}={0,2}', outside)[:4]:
        if len(token)>1024:
            limited=True
            continue  # long opaque data alone does not establish an attack
        try:
            decoded=base64.b64decode(token,validate=True).decode('utf-8')
        except (ValueError,UnicodeDecodeError,binascii.Error):
            continue
        if actionable(decoded):
            return Finding(True, 'ENCODED_OVERRIDE')
    return Finding(False, 'ENCODED_SCAN_LIMIT' if limited else 'NONE', educational_quote=educational)
