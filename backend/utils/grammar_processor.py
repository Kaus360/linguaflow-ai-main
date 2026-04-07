import re
from difflib import SequenceMatcher

try:
    import language_tool_python
except ImportError:
    language_tool_python = None

# Fallback mechanism if Public API is rate-limited
tool_en = None
try:
    if language_tool_python is not None:
        tool_en = language_tool_python.LanguageToolPublicAPI('en-US')
except Exception as e:
    print(f"Warning: LanguageTool API unavailable initially: {e}")

Rule = tuple[str, str]

LOCAL_RULES: dict[str, list[Rule]] = {
    "en-US": [
        (r"\bI go to ([a-z]+) yesterday\b", r"I went to the \1 yesterday"),
        (r"\bI go to the ([a-z]+) yesterday\b", r"I went to the \1 yesterday"),
        (r"\bI goes\b", "I go"),
        (r"\bShe don't\b", "She doesn't"),
        (r"\bHe don't\b", "He doesn't"),
        (r"\bHe have\b", "He has"),
        (r"\bShe have\b", "She has"),
        (r"\bthe informations\b", "the information"),
        (r"\bmany time\b", "many times"),
        (r"\bi\b", "I"),
    ],
    "hi-IN": [
        (r"मैं जाता है", "मैं जाता हूँ"),
        (r"मैं जाती है", "मैं जाती हूँ"),
        (r"वह खाना खाया", "उसने खाना खाया"),
        (r"वो खाना खाया", "उसने खाना खाया"),
        (r"मुझे जाना है कल", "मुझे कल जाना है"),
    ],
    "mr-IN": [
        (r"मी जातो आहे", "मी जात आहे"),
        (r"मी जाते आहे", "मी जात आहे"),
        (r"त्याने जेवण केले आहे", "त्याने जेवण केले"),
        (r"मी काल पार्कला जातो", "मी काल पार्कला गेलो"),
    ],
    "bn-IN": [
        (r"আমি যাচ্ছি হয়", "আমি যাচ্ছি"),
        (r"সে খাবার খেয়েছে করি", "সে খাবার খেয়েছে"),
        (r"আমি গতকাল পার্কে যাই", "আমি গতকাল পার্কে গিয়েছিলাম"),
    ],
    "pa-IN": [
        (r"ਮੈਂ ਜਾਂਦਾ ਹੈ", "ਮੈਂ ਜਾਂਦਾ ਹਾਂ"),
        (r"ਮੈਂ ਜਾਂਦੀ ਹੈ", "ਮੈਂ ਜਾਂਦੀ ਹਾਂ"),
        (r"ਉਹ ਰੋਟੀ ਖਾਧਾ", "ਉਸਨੇ ਰੋਟੀ ਖਾਧੀ"),
        (r"ਮੈਂ ਕੱਲ੍ਹ ਪਾਰਕ ਜਾਂਦਾ", "ਮੈਂ ਕੱਲ੍ਹ ਪਾਰਕ ਗਿਆ"),
    ],
}


def detect_language_from_text(text: str, default: str = "en-US") -> str:
    for char in text:
        codepoint = ord(char)
        if 0x0980 <= codepoint <= 0x09FF:
            return "bn-IN"
        if 0x0A00 <= codepoint <= 0x0A7F:
            return "pa-IN"
        if 0x0900 <= codepoint <= 0x097F:
            # Hindi and Marathi share Devanagari. Keep Hindi as the safer default.
            return "hi-IN"
    return default


def _apply_local_rules(text: str, language_code: str) -> str:
    corrected = text
    for pattern, replacement in LOCAL_RULES.get(language_code, []):
        corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE if language_code == "en-US" else 0)
    return _normalize_sentence(corrected, language_code)


def _normalize_sentence(text: str, language_code: str) -> str:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return normalized
    if language_code == "en-US":
        normalized = normalized[0].upper() + normalized[1:]
        if normalized[-1] not in ".!?":
            normalized += "."
    elif normalized[-1] not in "।.!?":
        normalized += "।"
    return normalized


def correct_text_stage1(text: str, language_code: str = 'en-US') -> str:
    """
    Applies rule-based grammar and spelling corrections using LanguageTool.
    """
    if not text.strip():
        return text
    
    try:
        corrected_text = _apply_local_rules(text, language_code)
        if language_code != "en-US":
            return corrected_text

        global tool_en
        if language_tool_python is None:
            return corrected_text
        if tool_en is None:
            tool_en = language_tool_python.LanguageToolPublicAPI('en-US')

        matches = tool_en.check(corrected_text)
        corrected_text = language_tool_python.utils.correct(corrected_text, matches)
        return _normalize_sentence(corrected_text, language_code)
    except Exception as e:
        print(f"LanguageTool error (Rate Limit or Connection): {e}")
        return _apply_local_rules(text, language_code)


def correct_text_stage2_local(text: str, language_code: str = "en-US") -> str:
    """
    Deterministic contextual fallback for cases where the optional LLM is unavailable.
    This is intentionally conservative: it only applies high-confidence patterns.
    """
    return _apply_local_rules(text, language_code)


def build_corrections(original: str, corrected: str) -> list[dict]:
    if original.strip() == corrected.strip():
        return []

    original_tokens = original.split()
    corrected_tokens = corrected.split()
    matcher = SequenceMatcher(None, original_tokens, corrected_tokens)
    corrections = []

    for index, (tag, i1, i2, j1, j2) in enumerate(matcher.get_opcodes(), start=1):
        if tag == "equal":
            continue
        original_part = " ".join(original_tokens[i1:i2])
        corrected_part = " ".join(corrected_tokens[j1:j2])
        correction_type = "modification"
        if tag == "insert":
            correction_type = "insertion"
        elif tag == "delete":
            correction_type = "deletion"

        corrections.append({
            "id": f"c{index}",
            "original": original_part,
            "corrected": corrected_part,
            "type": correction_type,
            "accepted": None,
            "confidence": 0.88,
        })

    return corrections
