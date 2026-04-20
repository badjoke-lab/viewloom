# ViewLoom タイトル・コピー規則 v0.1

## 0. 目的

本書は、ViewLoom のページタイトル、ブラウザ title、短いページラベルの順序を固定するための文書である。

目的は以下の3つである。

- feature 名を先に見せて、機能の違いを一目で分かるようにする
- Twitch / Kick を先頭に出しすぎて、公式感や誤認を強めないようにする
- URL 構造と画面上の見せ方を分離して、両方を自然に保つ

---

## 1. 基本原則

### 1.1 URL と表示は別に考える

- URL は platform-first でよい
- 画面タイトルと browser title は feature-first を基本とする

例:

- URL: `/twitch/heatmap/`
- 表示: `Heatmap`
- browser title: `Heatmap | Twitch ViewLoom`

### 1.2 feature-first を正式採用する範囲

feature-first を採用するのは **機能ページだけ** とする。

- Heatmap
- Day Flow
- Battle Lines

site top や portal まで feature-first にしない。

---

## 2. 固定ルール

### 2.1 portal

- H1: `ViewLoom`
- browser title: `ViewLoom`

### 2.2 site top

- H1: `Twitch ViewLoom`
- browser title: `Twitch ViewLoom`

- H1: `Kick ViewLoom`
- browser title: `Kick ViewLoom`

### 2.3 feature pages

#### Twitch
- H1: `Heatmap`
- browser title: `Heatmap | Twitch ViewLoom`

- H1: `Day Flow`
- browser title: `Day Flow | Twitch ViewLoom`

- H1: `Battle Lines`
- browser title: `Battle Lines | Twitch ViewLoom`

#### Kick
- H1: `Heatmap`
- browser title: `Heatmap | Kick ViewLoom`

- H1: `Day Flow`
- browser title: `Day Flow | Kick ViewLoom`

- H1: `Battle Lines`
- browser title: `Battle Lines | Kick ViewLoom`

---

## 3. 小ラベルの出し方

### 3.1 eyebrow / sublabel

feature page では、platform 名は H1 の前に小さく出してよい。

例:

- eyebrow: `Twitch / Now`
- H1: `Heatmap`

- eyebrow: `Kick / Today`
- H1: `Day Flow`

- eyebrow: `Twitch / Compare`
- H1: `Battle Lines`

### 3.2 原則

- H1 は短く保つ
- platform 名は補助ラベルに回す
- browser title で brand と platform を補う

---

## 4. なぜこの順にするか

### 4.1 可読性

機能ページ群を並べたときに、

- Heatmap
- Day Flow
- Battle Lines

の違いが先に見えるようにするため。

### 4.2 誤認抑制

`Twitch Heatmap` や `Kick Heatmap` のように platform 名を強く先頭へ出すより、
**feature を先に見せて、platform は補助に回したほうが公式感を弱めやすい**。

### 4.3 URL との両立

URL は `/twitch/heatmap/` のように platform-first のままが自然であり、
表示タイトルまで同じ順にする必要はない。

---

## 5. 不可

- feature page で `Twitch Heatmap` を正式表記にすること
- feature page で `Kick Day Flow` を正式表記にすること
- feature 名より platform 名が先に立つ browser title を増やすこと
- portal や site top まで feature-first に崩すこと

---

## 6. 一言定義

**ViewLoom の機能ページは、URL は platform-first、表示タイトルは feature-first を採用し、platform 名は補助ラベルと browser title 側で補う。**
