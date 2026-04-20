# ViewLoom UI固定書 v0.1

## 0. 文書の目的

本書は、ViewLoom の見た目を実装前に固定し、ページごとの場当たり調整を防ぐための UI 基準書である。

この文書で固定するのは以下である。

- 画面ごとの役割
- レイアウト骨格
- 情報の主従
- Twitch / Kick の色分離
- 共通シェル
- right rail / lower support block の扱い
- 実装前に固定するもの
- 実装後に調整するもの

本書は、今後の shell 実装と feature 実装の両方に対して、見た目の基準として扱う。

---

## 1. 全体方針

### 1.1 デザインの一言定義

ViewLoom は、**dark cinematic / product-grade / chart-first / platform-separated** の観測 UI とする。

### 1.2 参照元の使い分け

#### portal / site top
- 既存の portal / site-top モックを基本構造として使う
- ただし平板な管理画面にはしない
- カードだけで終わらず、商品トップとしての密度を持たせる

#### 3機能ページ
- Heatmap / Day Flow / Battle Lines の画像モックを各 feature の見た目基準とする
- 役割とレイアウト主語を崩さない

### 1.3 最優先順位

1. 安定動作
2. 可読性
3. 情報の主従
4. 更新の滑らかさ
5. 演出

---

## 2. 役割固定

### 2.1 機能ごとの主役

- Heatmap = Now
- Day Flow = Today
- Battle Lines = Compare

### 2.2 禁止

- Heatmap に Day Flow 的な1日説明を混ぜない
- Day Flow に Battle Lines 的な線比較を主役化しない
- Battle Lines に Heatmap 的な面積分布を主役化しない
- どの画面も全部入りにしない

---

## 3. サイト構造固定

### 3.1 URL 方針

- `/` = ViewLoom portal
- `/twitch/` = Twitch site top
- `/kick/` = Kick site top
- `/twitch/heatmap/` `/twitch/day-flow/` `/twitch/battle-lines/`
- `/kick/heatmap/` `/kick/day-flow/` `/kick/battle-lines/`

### 3.2 構造原則

- 入口は platform 単位で分ける
- 機能切替と platform 切替を混同しない
- Twitch と Kick は同じ骨格、別アクセントで作る

---

## 4. 共通 visual system

### 4.1 トーン

- dark background
- 深いグラデーション
- 弱い粒感または空間感
- 光はカード周辺と主領域に限定
- 見た目は高級感寄り、ゲーミング誇張には寄せすぎない

### 4.2 色

#### Twitch
- 紫主導
- 青寄りの冷たい補助光を許可

#### Kick
- 緑主導
- 青緑寄りの補助光を許可

### 4.3 背景

- 単色ベタ禁止
- 強すぎる流体アニメ禁止
- 背景は存在感を持つが主役にならない

### 4.4 タイポ

- 見出しは大きく明快
- 本文は短めで密度高め
- 数字はサマリー上でやや強く見せる
- 説明文は method / about に逃がし、主画面で長文化しない

### 4.5 角丸とカード

- 大枠カードは大きめの角丸
- 内部 card は一段階小さい角丸
- 角丸だけで可愛くしない
- border + shadow + glow のバランスで階層を出す

### 4.6 罫線と影

- 白っぽい強罫線禁止
- 暗背景に溶ける薄境界を使う
- 影は深く、輪郭は控えめにする

---

## 5. 共通 layout grammar

### 5.1 共通ページ骨格

すべての主要ページで以下の構造を持ってよい。

1. header
2. page hero or page intro
3. controls / meta row
4. main stage
5. right rail
6. lower support block
7. footer

### 5.2 主領域の原則

- ページごとに主役は1つだけ
- 主役領域は画面の中で最も大きく、最も強く見せる
- 補助情報は right rail と lower block に逃がす

### 5.3 right rail の原則

right rail は飾りではなく、**現在の読み**を補助する実用領域とする。

### 5.4 lower support block の原則

下部ブロックは、表・補助指標・feed・event を置く場所とする。
ただし、主役を奪うほど高密度にしない。

---

## 6. Header / nav 固定

### 6.1 portal header

- Brand
- Twitch
- Kick
- About
- Contact
- Donate

### 6.2 site header

- Brand
- Twitch
- Kick
- site-local feature nav
- About
- Status
- Donate
- Contact

### 6.3 nav 原則

- 今どの platform にいるか一目で分かる
- 今どの feature にいるか一目で分かる
- 全体 nav と site-local nav を混ぜすぎない

---

## 7. Portal `/` 固定

### 7.1 役割

portal は可視化ページではなく、**観測先を選ぶ玄関**とする。

### 7.2 構成

- hero
- Twitch / Kick の2カード
- 3-step explanation
- 軽量 status / note
- footer

### 7.3 やらないこと

- 重いチャートの常設
- Twitch / Kick の数値混在
- feature のミニ版常設

### 7.4 見た目原則

- hero は強く、本文は短く
- 2枚カードは大きめでブランド感を持たせる
- portal は feature より軽く、しかし単なるリンク集にはしない

---

## 8. `/twitch/` `/kick/` top 固定

### 8.1 役割

各 site top は、**その platform 専用観測サイトのホーム**とする。

### 8.2 構成

- hero
- 3機能カード
- status strip
- overview chart stage
- right rail
- lower support block

### 8.3 overview chart stage の扱い

- ここは本機能そのものではなく、site overview 用の主領域
- site top でも「商品画面らしさ」を出すために必要
- ただし feature 本体の役割を食わない

### 8.4 right rail の中身例

- leaderboard
- recent activity
- current status
- coverage note

### 8.5 lower support block の中身例

- top movers
- hot slots
- current leaders
- latest change summary

---

## 9. Heatmap ページ固定

### 9.1 役割

Heatmap は **Now view**。
今この瞬間の勢力図を、面積・色・補助演出で読む。

### 9.2 主役

- production treemap
- tile = 1 live stream
- area = viewers
- color = momentum
- activity = secondary signal

### 9.3 レイアウト

- 上部: title / short description / last updated / coverage / status
- controls row
- main: treemap board
- right rail: selected / summary / note / legend
- lower block: auxiliary explanation or compact lists

### 9.4 見た目原則

- 画面を高密度に埋める
- strip row 風の疑似配置は禁止
- 小タイルは無理に大きくしない
- zoom 前提を許容する

### 9.5 禁止

- bubble と treemap の並列本番表示
- activity を主色化すること
- viewers の意味を壊す装飾

---

## 10. Day Flow ページ固定

### 10.1 役割

Day Flow は **Today view**。
1日の支配率と総量の流れを、地形として読む。

### 10.2 主役

- large stacked landscape
- volume / share switch
- time focus
- detail panel

### 10.3 レイアウト

- 上部: title / short description / date / coverage / bucket / status
- controls row
- summary row
- main: day-flow chart
- right rail: time focus / selected ranking / strongest momentum / highest activity
- lower block: detail / legend / notes

### 10.4 見た目原則

- 帯の地形が主役
- 線を主役化しない
- マーカーは必要最小限
- volume と share の違いがUI上も混同されないこと

### 10.5 禁止

- 時間ごとの過度な再ソートを連想させる見た目
- 情報を全部ラベルで押し込むこと
- モバイルで time focus が死ぬこと

---

## 11. Battle Lines ページ固定

### 11.1 役割

Battle Lines は **Compare view**。
おすすめ battle、逆転、急伸、圧力、競り合いを線で読む。

### 11.2 名称

正式名称は **Battle Lines** とする。
Rivalry Radar は不採用。

### 11.3 主役

- comparison line chart
- primary battle
- secondary battles
- reversal strip
- custom state / recommended state

### 11.4 レイアウト

- 上部: title / short description / date / coverage / granularity / status
- controls row
- summary row
- recommended battle strip
- main: battle chart
- right rail: current battle detail / gap / pressure / next watch
- lower block: reversal strip / battle feed / focus strip

### 11.5 見た目原則

- ただの汎用 line chart にしない
- battle の主語が最初から見える
- pair / reversal / rise / heat overlap を読む画面にする
- custom に入った後も、何を見ているか見失わせない

### 11.6 禁止

- 初見で何を見ればよいか分からない画面
- recommended がない比較ツール状態
- custom 中に主役 battle を勝手に奪う挙動

---

## 12. right rail 固定方針

### 12.1 right rail の役割

- 主役画面を読むための補助
- 現在選択中の対象を明確化
- summary の再掲ではなく、現在の読みを深める

### 12.2 ページ別例

#### Heatmap
- selected stream
- viewers / momentum / activity
- open stream
- legend

#### Day Flow
- selected time
- top 1-5 at selected time
- strongest momentum
- highest activity or unavailable
- detail

#### Battle Lines
- primary battle detail
- current gap
- last reversal
- fastest challenger
- most heated battle

---

## 13. lower support block 固定方針

### 13.1 役割

- 右レールに収まらない補助情報を置く
- 表、feed、legend、event list を置く
- 主役の直下にあるが、主役を食わない

### 13.2 ページ別例

#### Heatmap
- compact explanatory note
- activity sampling note
- lower-ranked small highlights

#### Day Flow
- detail panel
- legend
- note
- optional selected-stream mini stats

#### Battle Lines
- reversal strip
- battle feed
- focus strip
- pair event list

---

## 14. モバイル方針

### 14.1 原則

- desktop の縮小版にしない
- 同時情報量を減らす
- details は bottom sheet に逃がす
- hover 前提 UI を使わない

### 14.2 portal

- hero は短く
- 2カードを縦積み
- explanation を簡略化

### 14.3 site top

- 3機能カードを縦積みまたは横スクロール少数表示
- right rail 情報を main の下へ移す

### 14.4 Heatmap

- top 20 / 50 中心
- tap + bottom sheet
- zoom を許容

### 14.5 Day Flow

- top 10 / 20 中心
- time focus は残す
- details は bottom sheet

### 14.6 Battle Lines

- top 3 / 5 中心
- recommended primary battle を最優先
- reversal strip は横スクロール可

---

## 15. ここで固定するもの

以下は、実装前に固定する。

- 画面ごとの役割
- 情報の主従
- portal / site top / feature の構造差
- Twitch / Kick の色分離
- right rail / lower block の存在
- page title / short description / meta row の存在
- Battle Lines という名称

---

## 16. 実装しながら詰めるもの

以下は、実装後の Pages 確認を通して調整してよい。

- glow の強さ
- 背景の濃さ
- shadow の深さ
- 角丸の最終値
- 文字サイズの細差
- card の高さ
- line 太さ
- Day Flow の境界の柔らかさ
- Heatmap tile 内ラベル密度
- right rail の最終情報量
- mobile の行間 / 余白 / 折り返し

---

## 17. 不可

- 役割が曖昧な画面
- 情報の主従が崩れた画面
- モックと違いすぎて商品感を失うこと
- 逆にモックに引きずられて可読性や安定性を捨てること
- 実装中に platform 構造を曖昧にすること

---

## 18. 次の作業順

1. 本書を基準に shared shell を作る
2. portal `/` を本命化
3. `/twitch/` `/kick/` top を本命化
4. Heatmap / Day Flow / Battle Lines の shell を本命化
5. Pages で見た目 QA
6. その後に Paid 最終判断
7. real data wiring へ進む

---

## 19. 一言定義

**ViewLoom UI固定書は、portal・site top・3機能ページの役割と見た目の骨格を先に固定し、細部の調整は実装後に Pages 上で詰めるための基準文書である。**
