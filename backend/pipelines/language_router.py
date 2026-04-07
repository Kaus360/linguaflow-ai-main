class LanguageRouter:
    def __init__(self):
        self.strategies = {}

    def register_strategy(self, language, strategy):
        self.strategies[language] = strategy

    def process(self, language, text):
        strategy = self.strategies.get(language) or self.strategies.get("en-US")
        if strategy is None:
            raise ValueError(f"Language '{language}' is not supported and no fallback is registered.")
        return strategy.execute(text)
