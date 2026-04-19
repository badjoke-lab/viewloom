# Livefield DBプラン・運用切替仕様書 v0.1

## 0. 文書の目的

本書は、Livefield を

* **Paid運用**
* **Free運用**
* **Paid⇄Free 切替**

の3状態で継続させるための、**DB運用仕様の基準書**です。

前提として、現在の単一D1 `livefield` は **502 MB** に達しており、manual collect も **`D1_ERROR: Exceeded maximum DB size`** で失敗しています。さらに prune 後でも `minute_snapshots = 37`、`collector_runs = 2361`、`heatmap_frames_5m = 3120`、`dayflow_bands_10m = 2621` が残っています。したがって、**現行の単一DB延命案は不採用**とします。 

Cloudflare の現行上限は、D1 が **Free: 1DB 500 MB / 1アカウント 5 GB**、**Paid: 1DB 10 GB / 1アカウント 1 TB** です。D1 は複数の小さめDBに分けて使う前提で案内されています。([Cloudflare Docs][1])

---

## 1. 共通不変仕様

### 1.1 役割分担

Livefield の核は変えません。

* **Heatmap = Now**
* **Day Flow = Today**
* **Battle Lines = Compare**

この役割分担は Paid / Free のどちらでも維持します。Heatmap は瞬間観測、Day Flow は1日の地形、Battle Lines は比較です。   

### 1.2 サイト分離

Twitch と Kick は混在させません。

* `/twitch/...`
* `/kick/...`

の公開単位を維持し、collector も保存も分離前提にします。仕様上も **Twitch 用 D1 と Kick 用 D1 を分ける前提が安全** とされています。 

### 1.3 状態表現

Paid / Free のどちらでも、次の状態表現は維持します。

* live
* stale
* partial
* empty
* error
* demo

また、**取得不足を黙って通常表示に見せない**ことを共通原則とします。 

### 1.4 コメント由来の盛り上がり

コメント由来の activity / agitation 表示は捨てません。
ただし、**viewer 本線と同じ保存粒度・同じ保持期間では扱わない**ことを共通方針とします。Heatmap の “active now”、Day Flow の activity、Battle Lines の Heat は維持対象です。  

---

## 2. 現状診断

### 2.1 現在の問題

現在は、設計以前に **DB が上限で止まっている**状態です。

* `database_size = 502 MB`
* manual collect = `D1_ERROR: Exceeded maximum DB size`
* today = empty
* rolling24h = 過去データ頼みの partial

です。 

### 2.2 現状から得た結論

以下を確定事項とします。

* **単一DB運用はやめる**
* **Deleteだけの延命はやめる**
* **DBは platform 別に分割する**
* **Hot と History を分離する**
* **一定条件で export / import による新DB切替を行う**

---

## 3. 採用するDBプラン

## 3.1 Paid本命版

**4DB構成**を採用します。

* `lf_twitch_hot`
* `lf_twitch_history`
* `lf_kick_hot`
* `lf_kick_history`

目的は、**Now/Today/Compare を止めないこと**です。
Hot は現在表示のための短中期データ、History は長期の集約だけを持ちます。

## 3.2 Free継続版

**2DB構成**を採用します。

* `lf_twitch_hot_free`
* `lf_kick_hot_free`

Free では History 専用 D1 を持ちません。
長期履歴は **D1外の archive** を前提とします。

## 3.3 なぜこの構成か

D1 は複数の小さなDBに分けて使う前提で案内されています。単一大DBに全部を混ぜるのではなく、**site 別 / 役割別に分ける**方が安全です。([Cloudflare Docs][2])

---

## 4. Paid運用仕様

## 4.1 目的

Paid では、**3機能 × 2サイト + 将来の履歴機能**を、かなり本命に近い形で維持します。
ただし、**全部を永久に同じ粒度で保存する設計は採りません**。

## 4.2 `*_hot` に置くもの

### viewer 系

* viewer raw: **48時間**
* current / latest snapshot meta: 常時
* status 用最小メタ: 常時

### rollup 系

* Heatmap 5m: **14日**
* Day Flow 5m: **30日**
* Battle Lines 5m: **30日**
* Day Flow 10m: **180日**
* Battle Lines 10m: **180日**

### comments/activity 系

* activity raw: **12時間**
* activity 5m: **14日**
* activity 10m: **90日**

### logs

* collector_runs: **7日**
* failure 詳細ログ: **72時間**

## 4.3 `*_history` に置くもの

* daily stream summary: **365日**
* daily activity summary: **365日**
* daily battle summary: **365日**
* monthly archive index: 長期

**365日を超える履歴は D1 に積み続けず、export して archive に移す**ことを前提にします。D1 は export / import を公式にサポートしています。([Cloudflare Docs][3])

## 4.4 Paidで維持する表示

### Heatmap

* Now を本役とする
* current / previous 比較
* activity signal あり
* 過去フレームは短〜中期のみ

### Day Flow

* today
* rolling24h
* yesterday
* date
* highest activity if available
* detail panel と time focus 維持

### Battle Lines

* today live
* rolling / yesterday / date
* primary / secondary battle
* heat / rise / reversal 補助
* activity 由来の Heat 表示は維持

## 4.5 Paidでもやらないこと

* 全 raw minute データの永久保存
* 全 comment raw の永久保存
* 無限の collector_runs 保持
* 単一DBへの再統合

---

## 5. Free運用仕様

## 5.1 目的

Free は **軽量サバイバル版**です。
サイトの核は残しますが、履歴の厚みは削ります。

## 5.2 `*_hot_free` に置くもの

### viewer 系

* viewer raw: **24時間**
* current / latest snapshot meta: 常時

### rollup 系

* Heatmap 5m: **3日**
* Day Flow 5m: **7日**
* Battle Lines 5m: **7日**
* Day Flow 10m: **30日**
* Battle Lines 10m: **30日**

### comments/activity 系

* activity raw: **6時間**
* activity 5m: **7日**
* activity 10m: **30日**

### logs

* collector_runs: **24時間**
* failure 詳細ログ: **保持しない**
* status 用 last success / last failure / note のみ

## 5.3 Freeで維持する表示

### Heatmap

* 今この瞬間の表示
* active now は維持
* 過去フレーム再生は縮小

### Day Flow

* today
* rolling24h
* yesterday
* date は維持可能だが、長期は 10m 中心
* activity は available 時のみ
* unavailable / partial 明示を許容

### Battle Lines

* today
* rolling
* yesterday
* date
* heat / rise / reversal は維持
* ただし長期 battle 履歴は粗い集約中心

## 5.4 Freeで削るもの

* 厚い Heatmap 過去フレーム
* 長い activity raw
* 詳細 collector_runs 長期保持
* 精密な過去 minute 履歴
* D1内の長期 stats 蓄積

## 5.5 Freeでの長期履歴

長期履歴は D1 に持たず、**静的 archive** として保持します。

* 日次 summary JSON
* 月次 summary JSON
* 必要時のみ読み込む

これにより、Free でも **Now / Today / Compare** の核だけは維持します。
共通仕様でも、無料運営前提で coverage 限定・partial・stale note は許容されています。 

---

## 6. Paid⇄Free 切替仕様

## 6.1 基本原則

* **共通不変仕様は変えない**
* 変わるのは **保持期間 / 履歴厚み / DB数 / archiveの使い方**
* 切替は **既存DB縮小**ではなく、**新DB作成と binding 切替**で行う

理由は、今回 prune 後でも DB size が 502 MB のままだったためです。
つまり、Delete 延命ではなく **新DB移行**が前提です。

## 6.2 Paid → Free 切替条件

以下のいずれかで Free 切替検討に入ります。

* **2か月連続で Livefield 収益ゼロ**
* 運営判断で Paid 継続理由が消失
* DB / CPU コストの抑制を優先する場合

## 6.3 Paid → Free 手順

1. collectors を停止
2. `*_history` を export
3. Free 用の保持範囲だけ抽出
4. `lf_twitch_hot_free` / `lf_kick_hot_free` を新規作成
5. import
6. binding 切替
7. smoke test

   * Heatmap now
   * Day Flow today / rolling24h / yesterday
   * Battle Lines today / rolling
8. 旧 Paid DB は export 保管後に停止または削除

## 6.4 Free → Paid 条件

* 収益再発生
* Free では保持できない履歴機能が必要
* 2サイトとも 3機能を本命運用したい

## 6.5 Free → Paid 手順

1. `*_history` DB 作成
2. archive import
3. Paid 用 retention に拡張
4. activity 保持期間拡張
5. binding 切替
6. smoke test

   * 2サイト × 3機能
   * past-date
   * history
   * activity overlay

---

## 7. コメント由来の盛り上がり表示仕様

## 7.1 原則

コメント由来の盛り上がりは **残す**。
ただし **viewer 本線と分離**する。

## 7.2 保存の扱い

### viewer 本線

* 3機能ページの土台
* 必須

### activity/comment 補助線

* Heatmap: active now
* Day Flow: highest activity / activity strip
* Battle Lines: Heat / overlap / heated battle

## 7.3 Paid / Free 差

### Paid

* activity raw 12h
* 5m 14d
* 10m 90d
* daily summary 365d

### Free

* activity raw 6h
* 5m 7d
* 10m 30d
* 長期は archive のみ

## 7.4 禁止

* comment raw の永久保存
* viewer と comment を同じ retention で持つこと

---

## 8. 運用閾値

## 8.1 Paid

### `*_hot`

* **7.5 GB 到達**で archive / rotate 検討
* **8.5 GB 到達**で切替準備
* **9.0 GB 到達**で新DBへ移行開始

### `*_history`

* **7.5 GB 到達**で古い daily を export
* **8.5 GB 到達**で新 history DB へ rotate

## 8.2 Free

### `*_hot_free`

* **350 MB 到達**で archive / cleanup 確認
* **420 MB 到達**で新DB切替準備
* **450 MB 到達**で新DBへ移行開始

理由は、Free 上限 500 MB に対し余白を持って止めるためです。([Cloudflare Docs][1])

---

## 9. 現時点の採用方針

### 正式採用

* **文書は1本**
* **運用モードは Paid / Free の2章構成**
* **DBは platform 別に分割**
* **Hot / History を分離**
* **Delete 延命ではなく export/import 移行前提**

### 直近の実行順

1. 単一 `livefield` DB は破棄対象とみなす
2. 新DB構成を作る
3. 先に Twitch で移行
4. 安定後に Kick へ展開
5. Paid / Free 両モードの retention をコード化

---

## 10. この仕様書の一言定義

**Livefield DBプラン・運用切替仕様書は、Now / Today / Compare の3役割と Twitch / Kick の2サイト構成を維持したまま、Paid本命版とFree継続版を同一プロダクトの運用モードとして切り替えるための保存・保持・移行ルールを定める文書である。**

---

## 11. 自律運用仕様

### 11.1 目的

本章は、Livefield を **定期的な手動確認なしで継続稼働**させるための自律運用条件を定める。
手動確認は任意の監査・確認行為として許可するが、**定常運用の成立条件にはしない**。
Paid / Free のいずれの運用モードでも、運用系は次の原則を満たさなければならない。

* collector が停止しても、可能な範囲で読取系表示を継続すること
* DB 容量逼迫時は、全停止ではなく段階的縮退で継続を優先すること
* DB 切替・archive・復旧は、定義済みルールに従って自動で進行すること
* 人手介入が必要な条件は限定列挙し、それ以外は自動運転で完結すること

### 11.2 自律運用の基本原則

#### 11.2.1 優先順位

自律運用時の優先順位は以下とする。

1. **Now / Today / Compare の中核表示を止めない**
2. 読取系 API を維持する
3. 書込量を抑える
4. 履歴の厚みを削る
5. 補助的な activity / archive / 詳細ログを削る
6. 最後にのみ DB 切替を行う

#### 11.2.2 先に守る機能

容量・CPU・collector 異常時に最優先で守る機能は以下とする。

* Heatmap の現在表示
* Day Flow の today / rolling24h
* Battle Lines の today / rolling

#### 11.2.3 先に削る機能

異常時に先に縮退対象とする機能は以下とする。

* 古い Heatmap 過去フレーム
* 詳細 collector_runs
* comment/activity の長期保持
* 過去日の高精度履歴
* 長期統計再計算
* 補助的なランキング・再描画・バックフィル

### 11.3 監視対象

自律運用系は、少なくとも以下を監視対象とする。

#### 11.3.1 DB 健全性

* DB サイズ
* テーブル別行数
* 日次増分
* 直近 24 時間の rows written
* 直近 24 時間の rows read
* archive 未処理量
* active DB / standby DB の生存状態

#### 11.3.2 collector 健全性

* last success
* last failure
* freshness
* 連続失敗回数
* 連続成功回数
* write error 種別
* CPU limit 発生回数
* DB size error 発生回数

#### 11.3.3 API 健全性

* Heatmap: now 取得可否
* Day Flow: today / rolling24h / yesterday の状態
* Battle Lines: today / rolling / yesterday の状態
* stale / partial / empty の比率
* 応答時間
* 直近 smoke test 成否

#### 11.3.4 データ健全性

* snapshot 時刻の単調増加
* bucket 欠落率
* rollup 最新時刻
* null / malformed row の有無
* archive 済 manifest と source delete の整合性

### 11.4 自動監視周期

#### 11.4.1 毎分監視

毎分、以下を実行する。

* collector freshness 確認
* latest snapshot 前進確認
* Heatmap now 簡易確認
* Day Flow today / rolling24h 簡易確認
* Battle Lines today 簡易確認
* 直近エラー種別の確認

#### 11.4.2 5分監視

5分ごとに以下を実行する。

* DB サイズ確認
* テーブル別行数確認
* retention 実行要否確認
* activity / rollup 遅延確認
* caution / degraded / rotation_pending 遷移判定

#### 11.4.3 1時間監視

1時間ごとに以下を実行する。

* archive backlog 確認
* 日次 summary 書込状況確認
* active / standby DB の整合確認
* 72時間先までの容量予測更新

#### 11.4.4 日次処理

日次で以下を実行する。

* retention 実行
* archive 実行
* archive 成功後 delete 実行
* history 系の整合確認
* 失敗ログ集約
* 翌日の容量見込み計算

#### 11.4.5 週次処理

週次で以下を実行する。

* DB 使用傾向レビュー
* rotation 余寿命確認
* Free / Paid 継続判定材料の更新
* archive 完了検証
* standby DB の切替リハーサル検証

### 11.5 自動状態機械

自律運用は、各 site / DB 系統ごとに次の状態を持つ。

* `normal`
* `caution`
* `degraded`
* `rotation_pending`
* `cutover_running`
* `recovery_running`
* `incident`

#### 11.5.1 normal

全監視値が許容範囲内であり、縮退なしで運転している状態。

#### 11.5.2 caution

第8章の第1閾値を超えた状態。
この状態では、**まだ中核機能は削らず、補助機能・ログ・保持期間の圧縮だけ**を行う。

#### 11.5.3 degraded

第8章の第2閾値を超えた状態、または collector 異常が継続する状態。
この状態では、**中核表示を守るために履歴厚みと補助指標を縮退**する。

#### 11.5.4 rotation_pending

第8章の第3閾値を超えた状態、または size error が発生した状態。
この状態では、**delete 延命を主手段にせず、新DB切替準備**へ移行する。

#### 11.5.5 cutover_running

新DB作成、必要データ搬送、binding 切替、smoke test、旧DB退避を実行中の状態。

#### 11.5.6 recovery_running

collector stale / partial 継続時に、自動復旧シーケンスを実行中の状態。

#### 11.5.7 incident

自動復旧・自動切替が連続失敗し、人手介入条件に達した状態。

### 11.6 閾値と自動アクション

本章の基本閾値は第8章に従う。
以下では、閾値超過時に行う自動アクションを定める。

#### 11.6.1 Paid の自動アクション

##### caution

* collector_runs retention を短縮
* failure 詳細ログの保持を短縮
* activity raw retention を短縮
* archive 実行頻度を上げる
* history 系の再計算を後回しにする

##### degraded

* Heatmap 過去フレーム生成を縮小
* Day Flow の古い raw 参照を止め、10m / daily 優先にする
* Battle Lines の古い高精度計算を止める
* 長期統計更新を停止
* activity 系を summary 中心にする

##### rotation_pending

* 非必須書込を停止
* standby DB 作成または再初期化
* carry-over dataset を export
* import 後に smoke test を実行
* 合格で cutover_running へ移行

#### 11.6.2 Free の自動アクション

##### caution

* collector_runs retention をさらに短縮
* activity raw をさらに短縮
* Heatmap 過去フレームをより短命化
* archive backlog を優先処理

##### degraded

* Day Flow の過去日は 10m / daily のみ
* Battle Lines の過去日は粗い集約のみ
* activity 補助線は available 時のみ
* 詳細ログ書込を停止

##### rotation_pending

* 非必須書込停止
* new free hot DB 準備
* 24時間 raw と必要最小限 rollup のみ搬送
* smoke test 後に binding 切替

### 11.7 自動縮退仕様

#### 11.7.1 縮退の原則

縮退は **段階的** に行い、いきなり route 自体を消さない。
縮退順は次のとおりとする。

1. failure 詳細ログ削減
2. collector_runs retention 短縮
3. activity raw retention 短縮
4. Heatmap 過去フレーム削減
5. Day Flow / Battle Lines の過去高精度表示停止
6. 長期履歴の live API 提供停止
7. archive / static summary 提供へ移行

#### 11.7.2 縮退しても維持するもの

以下は常に維持対象とする。

* Heatmap now
* Day Flow today
* Day Flow rolling24h
* Battle Lines today
* site top / status
* stale / partial / empty の明示

#### 11.7.3 縮退で許容する表示差

* yesterday / date の粒度低下
* activity unavailable 表示
* historical compare の summary 化
* partial note の表示増加

### 11.8 自動ローテーション仕様

#### 11.8.1 A/B スロット方式

自律運用のため、hot 系 DB は **active / standby の A/B スロット** を持つことを原則とする。
論理名と物理名は分ける。

例:

* 論理名: `lf_twitch_hot`
* 物理名: `lf_twitch_hot_a` / `lf_twitch_hot_b`

binding は常に論理名側を見る。
切替時は binding 先だけを差し替える。

#### 11.8.2 ローテーション開始条件

以下のいずれかでローテーションを開始する。

* 第8章の第3閾値到達
* `Exceeded maximum DB size`
* archive 後もサイズ改善が見られない
* DB 健全性検査が不合格
* cutover 可能な standby が存在する

#### 11.8.3 carry-over dataset

新DBへ引き継ぐ対象は以下のみとする。

* current / latest snapshot meta
* 直近の raw
* 必要最小限の 5m / 10m rollup
* collector_status
* 必要最小限の recent runs
* 直近の activity 集約

#### 11.8.4 引き継がないもの

* 古い raw 全量
* 古い detailed logs
* 過剰な history 再計算結果
* archive 済の旧データ

#### 11.8.5 切替後処理

切替後、旧 active DB は以下のいずれかとする。

* archive 完了後に削除
* read-only 保持
* 一定期間 standby 候補として保管

### 11.9 自動 archive 仕様

#### 11.9.1 archive 原則

archive は **source delete より先に成功確認**しなければならない。
archive 失敗時は source delete を実行してはならない。

#### 11.9.2 archive 単位

archive は日付単位または月単位で行う。
少なくとも以下を manifest 管理する。

* dataset 名
* 対象期間
* row count
* checksum
* export 時刻
* source delete 実行時刻

#### 11.9.3 archive 対象

* long-term daily summary
* old 10m rollup
* old activity summary
* old battle summary
* old monthly summary

#### 11.9.4 hot DB に残さない原則

hot DB は archive 完了後に対象期間を削除し、**時間とともに収束する DB** として維持する。

### 11.10 自動復旧仕様

#### 11.10.1 stale 復旧

freshness が閾値を超えた場合、以下を順に実行する。

1. status 再確認
2. collector 1回再試行
3. 失敗時は safe profile で再試行
4. 成功時は `recovery_running` を解除
5. 連続成功が規定回数に達したら normal に戻す

#### 11.10.2 safe profile

safe profile は site ごとに以下を縮小した collector 実行形態とする。

* page depth を安全値に戻す
* activity sampling を短縮
* 非必須 rollup を停止
* 詳細ログ書込を停止

#### 11.10.3 CPU limit 復旧

CPU limit が連続する場合は、

* safe profile に即時移行
* history 書込を停止
* activity 補助線を縮小
* それでも回復しない場合は rotation 判定へ進む

#### 11.10.4 size error 復旧

size error が発生した場合は、

* delete 延命を主手段としない
* 即時に rotation_pending へ遷移
* archive / cutover を優先
* 現 DB への継続書込は停止する

### 11.11 Paid ⇄ Free 自動切替補助仕様

#### 11.11.1 収益判断と技術切替の分離

Paid / Free の切替トリガは収益判断でよいが、**技術切替そのものはスクリプト化**する。
人間は「切替決定」を行ってもよいが、切替処理の実行は runbook / job で完結すること。

#### 11.11.2 Paid → Free

Paid → Free の技術切替時は、以下を自動実行対象とする。

* collectors 停止
* history export
* Free 用 carry-over dataset 生成
* new free hot DB 作成
* import
* binding 切替
* smoke test
* 旧 DB 凍結

#### 11.11.3 Free → Paid

Free → Paid の技術切替時は、以下を自動実行対象とする。

* history DB 作成
* archive import
* retention 拡張
* activity window 拡張
* binding 切替
* smoke test

### 11.12 自動 smoke test 仕様

#### 11.12.1 必須確認 route

切替・復旧・degraded 解除時には、少なくとも以下を確認する。

Twitch:

* Heatmap now
* Day Flow today
* Day Flow rolling24h
* Day Flow yesterday
* Battle Lines today
* Battle Lines rolling

Kick:

* Heatmap now
* Day Flow today
* Day Flow rolling24h
* Day Flow yesterday
* Battle Lines today
* Battle Lines rolling

#### 11.12.2 合格条件

* route が 200 を返す
* state が error ではない
* 必須 bucket が生成される
* stale / partial の理由が妥当
* latest snapshot / rollup 時刻が単調に進む

#### 11.12.3 不合格時

* binding を旧 active に戻す
* incident へ遷移
* read-only 継続に切り替える

### 11.13 通知・記録仕様

#### 11.13.1 通知対象

次のイベントは通知対象とする。

* normal → caution
* caution → degraded
* degraded → rotation_pending
* cutover 開始 / 完了 / 失敗
* archive 失敗
* recovery 失敗
* incident 遷移

#### 11.13.2 人手への通知

人手通知は **定期確認依頼**ではなく、**状態変化通知**とする。
つまり、人は「異常時のみ見る」前提でよい。

#### 11.13.3 自動記録

通知とは別に、運用系は次を自動記録する。

* state 遷移履歴
* cutover 履歴
* archive 履歴
* recovery 履歴
* smoke test 結果
* rollback 実行履歴

### 11.14 人手介入条件

以下に該当する場合のみ、人手介入を必要とする。

* active / standby の両方が不健康
* archive 先が継続的に不達
* export / import が連続失敗
* schema 不整合が検出された
* binding rollback も失敗した
* データ破損疑いがある
* 通知系そのものが死んでいる

これ以外は、**自動縮退・自動復旧・自動ローテーションで処理する**ことを原則とする。

### 11.15 本章の一言定義

**第11章 自律運用仕様は、Livefield を定期的な手動確認なしで継続稼働させるために、監視・縮退・ローテーション・archive・復旧・切替・通知の自動実行条件を定める章である。**

[1]: https://developers.cloudflare.com/d1/platform/limits/?utm_source=chatgpt.com "Limits · Cloudflare D1 docs"
[2]: https://developers.cloudflare.com/d1/?utm_source=chatgpt.com "Overview · Cloudflare D1 docs"
[3]: https://developers.cloudflare.com/d1/best-practices/import-export-data/?utm_source=chatgpt.com "Import and export data · Cloudflare D1 docs"