class LanguageRouter:
    def __init__(self):
        self.strategies = {}

    def register_strategy(self, language, strategy):
        self.strategies[language] = strategy

    def process(self, language, text):
        if language not in self.strategies:
            raise ValueError(f"Language '{language}' is not supported.")
        return self.strategies[language].execute(text)
