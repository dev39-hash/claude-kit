# PostToolUse hook (Write|Edit): keep the two memory folders identical.
# A file written in either folder is byte-copied to the same name in the other.
# Deletes/renames are not seen here and must be mirrored by hand.
# Never blocks: always exits 0. Keep this file pure ASCII (PowerShell 5.1 reads a
# BOM-less script in the ANSI code page, CP932 on this machine).

$primary = 'C:\Users\BAO\.claude\projects\c--DGB-Project-NichirinLaserMark\memory'
$backup  = 'C:\DGB\Project\NichirinLaserMark\.claude\memory'

try {
    [Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
    $raw  = [Console]::In.ReadToEnd().TrimStart([char]0xFEFF).Trim()
    $path = (ConvertFrom-Json $raw).tool_input.file_path
    if (-not $path) { exit 0 }
    $full = [IO.Path]::GetFullPath($path)

    foreach ($pair in @(@($primary, $backup), @($backup, $primary))) {
        $src = $pair[0].TrimEnd('\') + '\'
        if ($full.StartsWith($src, [StringComparison]::OrdinalIgnoreCase)) {
            $dest = Join-Path $pair[1] $full.Substring($src.Length)
            $dir  = Split-Path -Parent $dest
            if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
            [IO.File]::Copy($full, $dest, $true)
            break
        }
    }
} catch {
    [Console]::Error.WriteLine("sync-memory: mirror failed: $($_.Exception.Message)")
}
exit 0
