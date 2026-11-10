# 魔方模拟器：每个贴纸 = (位置, 法向, 颜色)。按标准记号转层，打印六面展开图，用来核对图案公式。
# 坐标：x 右，y 上，z 朝观众（前）。U/D/R/L/F/B 外层，M（随 L）、E（随 D）、S（随 F）中层；' 逆时针，2 半圈。
# 用法：python -I cube.py "M2 E2 S2"
import sys
import numpy as np

COL = {(0, 1, 0): "W", (0, -1, 0): "Y", (0, 0, 1): "G", (0, 0, -1): "B", (1, 0, 0): "R", (-1, 0, 0): "O"}  # 白顶绿前红右（西方配色）


def solved():
    st = []
    for n, c in COL.items():
        n = np.array(n)
        for a in (-1, 0, 1):
            for b in (-1, 0, 1):
                p = n.copy()
                free = [i for i in range(3) if n[i] == 0]
                p[free[0]], p[free[1]] = a, b
                st.append([p, n.copy(), c])
    return st


def rot(axis, k):
    # 绕坐标轴右手旋转 k*90°
    c, s = [(1, 0), (0, 1), (-1, 0), (0, -1)][k % 4]
    if axis == 0: return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    if axis == 1: return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


# 记号 → (轴, 层坐标, 顺时针对应的右手旋转次数)
MOVES = {"U": (1, 1, -1), "D": (1, -1, 1), "R": (0, 1, -1), "L": (0, -1, 1), "F": (2, 1, -1), "B": (2, -1, 1),
         "M": (0, 0, 1), "E": (1, 0, 1), "S": (2, 0, -1)}


def apply(st, seq):
    for tok in seq.split():
        f = tok[0]; axis, layer, k = MOVES[f]
        n = 2 if tok.endswith("2") else (-1 if tok.endswith("'") else 1)
        R = rot(axis, k * n)
        for s in st:
            if s[0][axis] == layer:
                s[0] = R @ s[0]; s[1] = R @ s[1]
    return st


def face(st, n, rows, cols):
    g = [["?"] * 3 for _ in range(3)]
    for p, nn, c in st:
        if tuple(nn) == n:
            g[rows.index(p[rows_axis[n]])][cols.index(p[cols_axis[n]])] = c
    return g


# 每个面的行列取哪个坐标、按什么顺序（展开图：U 在上，L F R B 一排，D 在下）
rows_axis = {(0, 1, 0): 2, (0, -1, 0): 2, (0, 0, 1): 1, (0, 0, -1): 1, (1, 0, 0): 1, (-1, 0, 0): 1}
cols_axis = {(0, 1, 0): 0, (0, -1, 0): 0, (0, 0, 1): 0, (0, 0, -1): 0, (1, 0, 0): 2, (-1, 0, 0): 2}
LAYOUT = {"U": ((0, 1, 0), [-1, 0, 1], [-1, 0, 1]), "L": ((-1, 0, 0), [1, 0, -1], [-1, 0, 1]), "F": ((0, 0, 1), [1, 0, -1], [-1, 0, 1]),
          "R": ((1, 0, 0), [1, 0, -1], [1, 0, -1]), "B": ((0, 0, -1), [1, 0, -1], [1, 0, -1]), "D": ((0, -1, 0), [1, 0, -1], [-1, 0, 1])}


def net(st):
    F = {k: face(st, n, r, c) for k, (n, r, c) in LAYOUT.items()}
    out = []
    for i in range(3): out.append("      " + "".join(F["U"][i]))
    for i in range(3): out.append(" ".join("".join(F[k][i]) for k in "LFRB"))
    for i in range(3): out.append("      " + "".join(F["D"][i]))
    return "\n".join(out), F


if __name__ == "__main__":
    for seq in sys.argv[1:]:
        st = apply(solved(), seq)
        print(f"== {seq}  ({len(seq.split())} 步)\n" + net(st)[0])
