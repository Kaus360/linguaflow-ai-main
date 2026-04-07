import os
import sys
import unittest

os.environ["HF_API_KEY"] = ""
sys.path.insert(0, "./backend")

from fastapi.testclient import TestClient

from backend.main import app
from pipelines.bengali import BengaliPipeline
from pipelines.english import EnglishPipeline
from pipelines.hindi import HindiPipeline
from pipelines.language_router import LanguageRouter
from pipelines.marathi import MarathiPipeline
from pipelines.punjabi import PunjabiPipeline
from utils.grammar_processor import (
    build_corrections,
    correct_text_stage1,
    detect_language_from_text,
    normalize_language_code,
)


class CorrectionPipelineTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def assertCorrects(self, language, raw, expected):
        stage1 = correct_text_stage1(raw, language)
        self.assertEqual(stage1, expected)
        corrections = build_corrections(raw, stage1)
        self.assertTrue(corrections, f"Expected correction metadata for {language}: {raw!r}")

    def test_stage1_corrects_english_asr_style_errors(self):
        cases = {
            "I go to park yesterday": "I went to the park yesterday.",
            "i have went to school": "I went to school.",
            "She don't like apples": "She doesn't like apples.",
            "the informations is correct": "The information is correct.",
            "there is many problem": "There are many problems.",
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertCorrects("en-US", raw, expected)

    def test_stage1_corrects_supported_indic_languages(self):
        cases = [
            ("hi-IN", "\u092e\u0948\u0902 \u091c\u093e\u0924\u093e \u0939\u0948", "\u092e\u0948\u0902 \u091c\u093e\u0924\u093e \u0939\u0942\u0901\u0964"),
            ("hi-IN", "\u092e\u0948\u0902 \u0915\u0932 \u0935\u093f\u0926\u094d\u092f\u093e\u0932\u092f \u0917\u092f\u093e \u0939\u0948", "\u092e\u0948\u0902 \u0915\u0932 \u0935\u093f\u0926\u094d\u092f\u093e\u0932\u092f \u0917\u092f\u093e \u0925\u093e\u0964"),
            ("hi-IN", "\u0939\u092e \u091c\u093e\u0924\u093e \u0939\u0948", "\u0939\u092e \u091c\u093e\u0924\u0947 \u0939\u0948\u0902\u0964"),
            ("mr-IN", "\u092e\u0940 \u091c\u093e\u0924\u094b \u0906\u0939\u0947", "\u092e\u0940 \u091c\u093e\u0924 \u0906\u0939\u0947\u0964"),
            ("mr-IN", "\u092e\u0940 \u0915\u093e\u0932 \u0936\u093e\u0933\u0947\u0924 \u091c\u093e\u0924\u094b", "\u092e\u0940 \u0915\u093e\u0932 \u0936\u093e\u0933\u0947\u0924 \u0917\u0947\u0932\u094b\u0964"),
            ("mr-IN", "\u0906\u092e\u094d\u0939\u0940 \u091c\u093e\u0924\u094b \u0906\u0939\u0947", "\u0906\u092e\u094d\u0939\u0940 \u091c\u093e\u0924 \u0906\u0939\u094b\u0924\u0964"),
            ("bn-IN", "\u0986\u09ae\u09bf \u09af\u09be\u099a\u09cd\u099b\u09bf \u09b9\u09af\u09bc", "\u0986\u09ae\u09bf \u09af\u09be\u099a\u09cd\u099b\u09bf\u0964"),
            ("bn-IN", "\u0986\u09ae\u09bf \u0995\u09be\u09b2 \u09b8\u09cd\u0995\u09c1\u09b2\u09c7 \u09af\u09be\u0987", "\u0986\u09ae\u09bf \u0995\u09be\u09b2 \u09b8\u09cd\u0995\u09c1\u09b2\u09c7 \u0997\u09bf\u09af\u09bc\u09c7\u099b\u09bf\u09b2\u09be\u09ae\u0964"),
            ("bn-IN", "\u0986\u09ae\u09bf \u09b8\u09cd\u0995\u09c1\u09b2\u09c7 \u0997\u09bf\u09af\u09bc\u09c7\u099b\u09c7", "\u0986\u09ae\u09bf \u09b8\u09cd\u0995\u09c1\u09b2\u09c7 \u0997\u09bf\u09af\u09bc\u09c7\u099b\u09bf\u09b2\u09be\u09ae\u0964"),
            ("pa-IN", "\u0a2e\u0a48\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a3e \u0a39\u0a48", "\u0a2e\u0a48\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a3e \u0a39\u0a3e\u0a02\u0964"),
            ("pa-IN", "\u0a2e\u0a48\u0a02 \u0a15\u0a71\u0a32\u0a4d\u0a39 \u0a38\u0a15\u0a42\u0a32 \u0a17\u0a3f\u0a06 \u0a39\u0a48", "\u0a2e\u0a48\u0a02 \u0a15\u0a71\u0a32\u0a4d\u0a39 \u0a38\u0a15\u0a42\u0a32 \u0a17\u0a3f\u0a06 \u0a38\u0a40\u0964"),
            ("pa-IN", "\u0a05\u0a38\u0a40\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a3e \u0a39\u0a48", "\u0a05\u0a38\u0a40\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a47 \u0a39\u0a3e\u0a02\u0964"),
        ]
        for language, raw, expected in cases:
            with self.subTest(language=language):
                self.assertCorrects(language, raw, expected)

    def test_pipelines_use_local_fallback_without_hf_key(self):
        cases = [
            (EnglishPipeline(), "I go to park yesterday", "I went to the park yesterday."),
            (HindiPipeline(), "\u092e\u0948\u0902 \u091c\u093e\u0924\u093e \u0939\u0948", "\u092e\u0948\u0902 \u091c\u093e\u0924\u093e \u0939\u0942\u0901\u0964"),
            (MarathiPipeline(), "\u092e\u0940 \u091c\u093e\u0924\u094b \u0906\u0939\u0947", "\u092e\u0940 \u091c\u093e\u0924 \u0906\u0939\u0947\u0964"),
            (BengaliPipeline(), "\u0986\u09ae\u09bf \u09af\u09be\u099a\u09cd\u099b\u09bf \u09b9\u09af\u09bc", "\u0986\u09ae\u09bf \u09af\u09be\u099a\u09cd\u099b\u09bf\u0964"),
            (PunjabiPipeline(), "\u0a2e\u0a48\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a3e \u0a39\u0a48", "\u0a2e\u0a48\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a3e \u0a39\u0a3e\u0a02\u0964"),
        ]
        for pipeline, raw, expected in cases:
            with self.subTest(pipeline=type(pipeline).__name__):
                self.assertEqual(pipeline.execute(raw)["stage2_text"], expected)

    def test_text_endpoint_returns_corrected_text_and_corrections(self):
        response = self.client.post(
            "/api/text/",
            json={"text": "I go to park yesterday", "language": "en-US"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["stage2_corrected"], "I went to the park yesterday.")
        self.assertEqual(payload["language"], "en-US")
        self.assertTrue(payload["corrections"])

    def test_text_endpoint_corrects_hindi_past_tense_asr_error(self):
        response = self.client.post(
            "/api/text/",
            json={
                "text": "\u092e\u0948\u0902 \u0915\u0932 \u0935\u093f\u0926\u094d\u092f\u093e\u0932\u092f \u0917\u092f\u093e \u0939\u0948",
                "language": "hi-IN",
            },
        )
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["stage2_corrected"], "\u092e\u0948\u0902 \u0915\u0932 \u0935\u093f\u0926\u094d\u092f\u093e\u0932\u092f \u0917\u092f\u093e \u0925\u093e\u0964")
        self.assertEqual(payload["language"], "hi-IN")
        self.assertTrue(payload["corrections"])

    def test_auto_text_endpoint_detects_non_english_scripts(self):
        cases = [
            ("\u092e\u0948\u0902 \u091c\u093e\u0924\u093e \u0939\u0948", "hi-IN"),
            ("\u0986\u09ae\u09bf \u09af\u09be\u099a\u09cd\u099b\u09bf \u09b9\u09af\u09bc", "bn-IN"),
            ("\u0a2e\u0a48\u0a02 \u0a1c\u0a3e\u0a02\u0a26\u0a3e \u0a39\u0a48", "pa-IN"),
        ]
        for raw, expected_language in cases:
            with self.subTest(expected_language=expected_language):
                response = self.client.post("/api/text/", json={"text": raw, "language": "auto"})
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(response.json()["language"], expected_language)
                self.assertTrue(response.json()["corrections"])

    def test_language_helpers_and_router_fallback_do_not_crash_on_bad_language(self):
        self.assertEqual(detect_language_from_text("hello"), "en-US")
        self.assertEqual(normalize_language_code("xx-XX", "I go to park yesterday"), "en-US")

        router = LanguageRouter()
        router.register_strategy("en-US", EnglishPipeline())
        result = router.process("xx-XX", "I go to park yesterday")
        self.assertEqual(result["stage2_text"], "I went to the park yesterday.")

    def test_endpoint_rejects_empty_and_oversized_text(self):
        empty = self.client.post("/api/text/", json={"text": "   ", "language": "en-US"})
        self.assertEqual(empty.status_code, 400)

        oversized = self.client.post("/api/text/", json={"text": "a" * 2001, "language": "en-US"})
        self.assertEqual(oversized.status_code, 400)


if __name__ == "__main__":
    unittest.main(verbosity=2)
