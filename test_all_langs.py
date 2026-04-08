import sys
sys.path.append("./backend")
import asyncio
from pipelines.english import EnglishPipeline
from pipelines.hindi import HindiPipeline
from pipelines.punjabi import PunjabiPipeline
from pipelines.marathi import MarathiPipeline
from pipelines.bengali import BengaliPipeline

def test_datasets():
    print("Testing EnglishPipeline Dataset connectivity...")
    en_pipe = EnglishPipeline()
    assert len(en_pipe.examples) > 0, "English Dataset was not loaded!"
    
    hi_pipe = HindiPipeline()
    assert len(hi_pipe.examples) > 0, "Hindi Dataset was not loaded!"
    
    pa_pipe = PunjabiPipeline()
    assert len(pa_pipe.examples) > 0, "Punjabi Dataset was not loaded!"
    
    mr_pipe = MarathiPipeline()
    assert len(mr_pipe.examples) > 0, "Marathi Dataset was not loaded!"
    
    bn_pipe = BengaliPipeline()
    assert len(bn_pipe.examples) > 0, "Bengali Dataset was not loaded!"
    
    print("All language datasets loaded correctly!")
    
if __name__ == "__main__":
    test_datasets()
