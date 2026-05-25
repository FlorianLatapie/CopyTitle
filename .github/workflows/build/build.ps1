$zip = "CopyTitle.zip"

Remove-Item $zip -ErrorAction Ignore

$exclude = @(
    ".git",
    ".gitignore",
    ".github",
    "*.zip",
    "*.ps1",
    "*.md",
    "temp",
    "CWS",
    "bookmarklet.js"
)

New-Item temp -ItemType Directory | Out-Null

Get-ChildItem -Force |
    Where-Object {
        $name = $_.Name
        -not ($exclude | Where-Object { $name -like $_ })
    } |
    Copy-Item -Destination temp -Recurse -Force

Compress-Archive temp\* $zip

Remove-Item temp -Recurse -Force
