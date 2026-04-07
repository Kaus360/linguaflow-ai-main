import language_tool_python

# Use Public API to avoid local Java dependencies when testing
tool_en = language_tool_python.LanguageToolPublicAPI('en-US')

def correct_text_stage1(text: str, language_code: str = 'en-US') -> str:
    """
    Applies rule-based grammar and spelling corrections using LanguageTool.
    """
    if not text.strip():
        return text
    
    try:
        # Defaulting to English tool for now
        tool = tool_en
        matches = tool.check(text)
        corrected_text = language_tool_python.utils.correct(text, matches)
        return corrected_text
    except Exception as e:
        print(f"LanguageTool error: {e}")
        return text
