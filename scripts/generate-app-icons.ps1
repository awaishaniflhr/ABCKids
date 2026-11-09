param(
    [string]$Source = (Join-Path $PSScriptRoot '../assets/branding/app-icon-source.png')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceImage = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($Source))
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Write-ProjectText([string]$RelativePath, [string]$Content) {
    $destination = Join-Path $projectRoot $RelativePath
    [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destination)) | Out-Null
    [System.IO.File]::WriteAllText($destination, $Content + "`n", $utf8)
}

function Write-Icon([string]$RelativePath, [int]$Size, [string]$Kind = 'square') {
    $format = [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
    if ($Kind -ne 'square') { $format = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb }
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, $format)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $attributes = New-Object System.Drawing.Imaging.ImageAttributes
    try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
        $graphics.Clear([System.Drawing.Color]::White)
        $inset = 0
        if ($Kind -eq 'adaptive') {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            # Keep the original illustration inside Android's central 66 dp safe area.
            $inset = [int][Math]::Round($Size * (108 - 64) / 216)
        } elseif ($Kind -eq 'round') {
            $graphics.Clear([System.Drawing.Color]::Transparent)
            $circle = New-Object System.Drawing.Drawing2D.GraphicsPath
            try {
                $circle.AddEllipse(0, 0, $Size, $Size)
                $graphics.SetClip($circle)
                $graphics.Clear([System.Drawing.Color]::White)
            } finally { $circle.Dispose() }
            $inset = [int][Math]::Round($Size * 0.08)
        }
        $rectangle = New-Object System.Drawing.Rectangle($inset, $inset, ($Size - 2 * $inset), ($Size - 2 * $inset))
        $graphics.DrawImage($sourceImage, $rectangle, 0, 0, $sourceImage.Width, $sourceImage.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
        $destination = Join-Path $projectRoot $RelativePath
        [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destination)) | Out-Null
        $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $attributes.Dispose()
        $graphics.Dispose()
        $bitmap.Dispose()
    }
}

try {
    if ($sourceImage.Width -ne $sourceImage.Height) { throw 'Use a square source image to avoid distorting the artwork.' }

    $densities = @(
        @{ Name = 'mdpi'; Scale = 1 },
        @{ Name = 'hdpi'; Scale = 1.5 },
        @{ Name = 'xhdpi'; Scale = 2 },
        @{ Name = 'xxhdpi'; Scale = 3 },
        @{ Name = 'xxxhdpi'; Scale = 4 }
    )
    foreach ($density in $densities) {
        $folder = "android/app/src/main/res/mipmap-$($density.Name)"
        Write-Icon "$folder/ic_launcher.png" ([int](48 * $density.Scale))
        Write-Icon "$folder/ic_launcher_round.png" ([int](48 * $density.Scale)) 'round'
        Write-Icon "$folder/ic_launcher_foreground.png" ([int](108 * $density.Scale)) 'adaptive'
    }
    $adaptiveXml = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'@
    Write-ProjectText 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml' $adaptiveXml
    Write-ProjectText 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml' $adaptiveXml
    Write-ProjectText 'android/app/src/main/res/drawable/ic_launcher_background.xml' @'
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
</shape>
'@

    $slots = @(
        @{ Idiom = 'iphone'; Size = 20; Scales = @(2, 3) },
        @{ Idiom = 'iphone'; Size = 29; Scales = @(2, 3) },
        @{ Idiom = 'iphone'; Size = 40; Scales = @(2, 3) },
        @{ Idiom = 'iphone'; Size = 60; Scales = @(2, 3) },
        @{ Idiom = 'ipad'; Size = 20; Scales = @(1, 2) },
        @{ Idiom = 'ipad'; Size = 29; Scales = @(1, 2) },
        @{ Idiom = 'ipad'; Size = 40; Scales = @(1, 2) },
        @{ Idiom = 'ipad'; Size = 76; Scales = @(1, 2) },
        @{ Idiom = 'ipad'; Size = 83.5; Scales = @(2) },
        @{ Idiom = 'ios-marketing'; Size = 1024; Scales = @(1) }
    )
    $images = @()
    foreach ($slot in $slots) {
        foreach ($scale in $slot.Scales) {
            $pixels = [int]($slot.Size * $scale)
            $filename = "AppIcon-${pixels}.png"
            Write-Icon "ios/ABCKids/Images.xcassets/AppIcon.appiconset/$filename" $pixels
            $pointSize = $slot.Size.ToString([System.Globalization.CultureInfo]::InvariantCulture)
            $images += [ordered]@{
                filename = $filename
                idiom = $slot.Idiom
                scale = "${scale}x"
                size = "${pointSize}x${pointSize}"
            }
        }
    }
    $catalog = [ordered]@{ images = $images; info = @{ author = 'xcode'; version = 1 } }
    Write-ProjectText 'ios/ABCKids/Images.xcassets/AppIcon.appiconset/Contents.json' ($catalog | ConvertTo-Json -Depth 5)
    Write-Icon 'assets/branding/play-store-icon-512.png' 512
    Write-Output 'Generated Android legacy/adaptive icons, iPhone/iPad icons, and the 512 px store image.'
} finally { $sourceImage.Dispose() }
