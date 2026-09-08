# Dayflow

個人用のタスク、予定、メモ、ポモドーロを一箇所で扱う静的ダッシュボードです。

## 機能

- タスク管理（優先度、期限、繰り返し、サブタスク、通知）
- カレンダー、クイックメモ、ポモドーロ
- ブックマーク管理
- 電卓と単位変換
- QRコード生成
- 文章の差分比較

データの保存と各ツールの処理はブラウザ内で行います。QRコード生成には、固定バージョン・SRI検証付きで読み込むMITライセンスの qrcode-generator を使用しています。

## GitHub Pages への公開

1. このフォルダをGitHubリポジトリにpushします。既存リポジトリなら、既定ブランチは `main` にしてください。
2. GitHubのリポジトリで **Settings → Pages** を開き、**Build and deployment** の **Source** を **GitHub Actions** に変更します。
3. `main` へのpush後、**Actions** の「Deploy static site to GitHub Pages」が完了すると、PagesのURLで公開されます。

データはブラウザのLocal Storageにのみ保存されます。同じブラウザ・端末では保持されますが、端末間での同期はしません。
