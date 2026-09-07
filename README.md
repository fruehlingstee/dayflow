# Dayflow

個人用のタスク、予定、メモ、ポモドーロを一箇所で扱う静的ダッシュボードです。

## GitHub Pages への公開

1. このフォルダをGitHubリポジトリにpushします。既存リポジトリなら、既定ブランチは `main` にしてください。
2. GitHubのリポジトリで **Settings → Pages** を開き、**Build and deployment** の **Source** を **GitHub Actions** に変更します。
3. `main` へのpush後、**Actions** の「Deploy static site to GitHub Pages」が完了すると、PagesのURLで公開されます。

データはブラウザのLocal Storageにのみ保存されます。同じブラウザ・端末では保持されますが、端末間での同期はしません。
