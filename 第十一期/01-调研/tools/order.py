# 用模拟器算「一串动作重复几次会回到复原」（群论里的「阶」），再验证几个群论现象。
import sys, numpy as np
from cube import solved, apply
def key(st): return tuple(sorted((tuple(p), tuple(n), c) for p, n, c in st))
S0 = key(solved())
def order(seq, cap=5000):
    st = solved()
    for k in range(1, cap + 1):
        st = apply(st, seq)
        if key(st) == S0: return k
    return None
for seq in ["R", "R U", "R U R' U'", "R U2 D' B D'", "R U'", "F R", "R2 U2"]:
    print(f"{seq:16s} 阶 = {order(seq)}")
# 交换子只动很少几块：数一数 [R U R' U'] 一次之后有几块离开原位
def moved(seq):
    a = solved(); b = apply(solved(), seq)
    ka = {(tuple(p), tuple(n)): c for p, n, c in a}; kb = {(tuple(p), tuple(n)): c for p, n, c in b}
    cubies = set()
    for (p, n), c in kb.items():
        if ka[(p, n)] != c: cubies.add(p)
    return len(cubies)
for seq in ["R U R' U'", "R U R' U' R' F R2 U' R' U' R U R' F'", "R' F R' B2 R F' R' B2 R2"]:
    print(f"{seq:45s} 动了 {moved(seq)} 个小块（位置）")
