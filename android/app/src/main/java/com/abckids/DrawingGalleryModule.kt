package com.abckids

import android.Manifest
import android.content.ContentValues
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Executors

/** Writes a canvas PNG to Pictures/ABC Kids without reading anyone's photos. */
class DrawingGalleryModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
  private val worker = Executors.newSingleThreadExecutor()

  override fun getName() = "DrawingGallery"

  @ReactMethod
  fun savePng(base64: String, templateId: String, promise: Promise) {
    worker.execute {
      try {
        if (base64.length > 16_000_000) throw IOException("Picture is too large")
        val bytes = Base64.decode(base64, Base64.DEFAULT)
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        if (bounds.outMimeType != "image/png" || bounds.outWidth !in 1..4096 || bounds.outHeight !in 1..4096) {
          throw IOException("Invalid PNG picture")
        }
        val name = templateId.replace(Regex("[^a-zA-Z0-9_-]"), "").take(32).ifEmpty { "drawing" }
        val fileName = "ABC-Kids-$name-${UUID.randomUUID()}.png"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          saveModern(bytes, fileName, promise)
        } else {
          saveLegacy(bytes, fileName, promise)
        }
      } catch (error: Exception) {
        promise.reject("E_SAVE_PICTURE", "Could not save the picture. Please try again.", error)
      }
    }
  }

  private fun saveModern(bytes: ByteArray, fileName: String, promise: Promise) {
    val resolver = context.contentResolver
    val values = ContentValues().apply {
      put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
      put(MediaStore.Images.Media.MIME_TYPE, "image/png")
      put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/ABC Kids")
      put(MediaStore.Images.Media.IS_PENDING, 1)
    }
    val collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
    val uri = resolver.insert(collection, values) ?: throw IOException("Could not create picture")
    try {
      (resolver.openOutputStream(uri) ?: throw IOException("Could not open picture")).use { it.write(bytes) }
      val published = ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) }
      if (resolver.update(uri, published, null, null) != 1) throw IOException("Could not publish picture")
      promise.resolve(uri.toString())
    } catch (error: Exception) {
      // Only remove the incomplete item created by this save attempt.
      runCatching { resolver.delete(uri, null, null) }
      throw error
    }
  }

  @Suppress("DEPRECATION")
  private fun saveLegacy(bytes: ByteArray, fileName: String, promise: Promise) {
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
      promise.reject("E_PERMISSION", "Allow saving pictures to save your drawing.")
      return
    }
    val album = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "ABC Kids")
    if (!album.isDirectory && !album.mkdirs()) throw IOException("Could not create album")
    val file = File(album, fileName)
    try {
      file.outputStream().use { it.write(bytes) }
      MediaScannerConnection.scanFile(context, arrayOf(file.absolutePath), arrayOf("image/png")) { _: String, uri: Uri? ->
        if (uri != null) promise.resolve(uri.toString())
        else {
          file.delete()
          promise.reject("E_SAVE_PICTURE", "Could not add the picture to the gallery.")
        }
      }
    } catch (error: Exception) {
      file.delete()
      throw error
    }
  }

  override fun invalidate() {
    worker.shutdown()
    super.invalidate()
  }
}
