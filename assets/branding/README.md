The original supplied artwork is `app-icon-source.png`. It is not imported into the JavaScript bundle.

Regenerate the native assets on Windows from the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-app-icons.ps1
```

This writes the Android launcher densities (including round fallbacks and adaptive layers), the iPhone/iPad asset catalog, an opaque 1024 px App Store icon, and `play-store-icon-512.png`. Android's manifest and Xcode's AppIcon build setting already select these resources. A native rebuild/reinstall is needed to see icon changes; Fast Refresh does not update them.

The adaptive layer places the supplied illustration inside the central safe area to preserve the faces and lettering across launcher shapes. See [Android's adaptive icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive).
