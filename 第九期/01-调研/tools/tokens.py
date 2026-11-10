# Compare token counts of the same content in Markdown / HTML / JSON / YAML / plain text.
import json

title, items, note = "周末计划", ["买菜", "看电影", "给妈妈打电话"], "最重要：别熬夜"
fmts = {
    "Markdown": f"# {title}\n\n- {items[0]}\n- {items[1]}\n- {items[2]}\n\n**{note}**\n",
    "HTML": f"<h1>{title}</h1>\n<ul>\n<li>{items[0]}</li>\n<li>{items[1]}</li>\n<li>{items[2]}</li>\n</ul>\n<p><strong>{note}</strong></p>\n",
    "JSON": json.dumps({"title": title, "items": items, "important": note}, ensure_ascii=False, indent=2),
    "YAML": f"title: {title}\nitems:\n  - {items[0]}\n  - {items[1]}\n  - {items[2]}\nimportant: {note}\n",
    "纯文本": f"{title}\n{items[0]}\n{items[1]}\n{items[2]}\n{note}\n",
}
pieces = ["**重点**", "# 标题", "- 买菜", "<strong>重点</strong>", "<h1>标题</h1>"]


def run(encode, decode, name):
    out = [name]
    for k, v in fmts.items():
        out.append(f"{k}\tchars={len(v)}\ttokens={len(encode(v))}")
    for t in pieces:
        ids = encode(t)
        out.append(f"{t}\t{len(ids)}\t{[decode([i]) for i in ids]}")
    return "\n".join(out)


if __name__ == "__main__":
    import tiktoken
    enc = tiktoken.get_encoding("o200k_base")  # GPT-4o / GPT-5 family tokenizer
    print(run(enc.encode, enc.decode, "o200k_base"))
