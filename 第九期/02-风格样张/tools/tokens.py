# Token blocks for the "周末计划" sheet (o200k_base, GPT-4o/GPT-5 family).
# A Chinese character split across tokens becomes one block with n = number of tokens, so the total still counts right.
import json, tiktoken

enc = tiktoken.get_encoding("o200k_base")
md = "# 周末计划\n\n- 买菜\n- 看电影\n- 给妈妈打电话\n\n**最重要：别熬夜**\n"
out, buf, n = [], b"", 0
for i in enc.encode(md):
    buf += enc.decode_single_token_bytes(i)
    n += 1
    try:
        s = buf.decode("utf-8")
    except UnicodeDecodeError:
        continue
    out.append({"t": s, "n": n})
    buf, n = b"", 0
with open("assets/img/tokens.js", "w", encoding="utf-8") as f:
    f.write("window.TOKENS = " + json.dumps(out, ensure_ascii=False) + ";\n")
print(sum(o["n"] for o in out), "tokens:", " | ".join(f"{o['t']!r}x{o['n']}" for o in out))
