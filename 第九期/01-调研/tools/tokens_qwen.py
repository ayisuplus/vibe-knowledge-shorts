# Same comparison with Qwen3's tokenizer (a Chinese open model), to check the result isn't OpenAI-specific.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from transformers import AutoTokenizer
from tokens import run

tok = AutoTokenizer.from_pretrained("Qwen/Qwen3-8B")
print(run(lambda s: tok.encode(s, add_special_tokens=False), tok.decode, "Qwen3"))
