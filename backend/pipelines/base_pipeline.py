from abc import ABC, abstractmethod

class LanguagePipeline(ABC):
    @abstractmethod
    def execute(self, text: str) -> dict:
        """
        Executes the Stage 2 correction (LLM contextual).
        Expects Stage 1 text as input.
        Returns a dict with Stage 2 correction details.
        """
        pass
