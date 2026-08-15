#!/bin/bash
# Build NIGHTMARE AI APK manually without gradle
set -e

ANDROID_HOME=/home/z/android-sdk
JAVA_HOME=/home/z/jdk17
BUILD_TOOLS=$ANDROID_HOME/build-tools/34.0.0
PLATFORM_JAR=$ANDROID_HOME/platforms/android-34/android.jar
PROJECT=/home/z/my-project/android-apk/nightmare-webview
BUILD_DIR=$PROJECT/app/build/manual
APK_NAME=nightmare-ai

echo "=== Step 1: Clean build dir ==="
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/compiled-res" "$BUILD_DIR/gen" "$BUILD_DIR/obj" "$BUILD_DIR/dex"

echo "=== Step 2: Compile resources with aapt2 ==="
$BUILD_TOOLS/aapt2 compile --dir "$PROJECT/app/src/main/res" -o "$BUILD_DIR/compiled-res/"

echo "=== Step 3: Link resources + generate R.java ==="
$BUILD_TOOLS/aapt2 link \
  -I "$PLATFORM_JAR" \
  --manifest "$PROJECT/app/src/main/AndroidManifest.xml" \
  --java "$BUILD_DIR/gen" \
  -o "$BUILD_DIR/app-linked.apk" \
  --auto-add-overlay \
  $(ls $BUILD_DIR/compiled-res/*.flat)

echo "=== Step 4: Write + compile Java sources ==="
mkdir -p "$BUILD_DIR/src/com/nightmarecommunity/ai"
cat > "$BUILD_DIR/src/com/nightmarecommunity/ai/MainActivity.java" <<'JAVA'
package com.nightmarecommunity.ai;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.widget.ProgressBar;

public class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        progressBar = findViewById(R.id.progressBar);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " NIGHTMARE_AI_TWA/0.2.2");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("https://nightmare-ai.ojaskhanna432.workers.dev/");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
JAVA

JAVA_SOURCES=$(find "$BUILD_DIR/gen" -name "*.java")
$JAVA_HOME/bin/javac \
  -source 17 -target 17 \
  -classpath "$PLATFORM_JAR" \
  -d "$BUILD_DIR/obj" \
  $JAVA_SOURCES \
  $BUILD_DIR/src/com/nightmarecommunity/ai/MainActivity.java

echo "=== Step 5: Convert to DEX with d8 ==="
CLASS_FILES=$(find "$BUILD_DIR/obj" -name "*.class")
$BUILD_TOOLS/d8 \
  --release \
  --min-api 24 \
  --lib "$PLATFORM_JAR" \
  --output "$BUILD_DIR/dex" \
  $CLASS_FILES

echo "=== Step 6: Build unsigned APK ==="
cp "$BUILD_DIR/app-linked.apk" "$BUILD_DIR/app-unsigned.apk"
cd "$BUILD_DIR"
zip -j app-unsigned.apk dex/classes.dex
cd "$PROJECT"

echo "=== Step 7: Zipalign ==="
$BUILD_TOOLS/zipalign -f 4 "$BUILD_DIR/app-unsigned.apk" "$BUILD_DIR/app-aligned.apk"

echo "=== Step 8: Generate debug keystore ==="
if [ ! -f "$BUILD_DIR/debug.keystore" ]; then
  $JAVA_HOME/bin/keytool \
    -genkeypair \
    -keystore "$BUILD_DIR/debug.keystore" \
    -storepass android \
    -alias androiddebugkey \
    -keypass android \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US"
fi

echo "=== Step 9: Sign APK ==="
$BUILD_TOOLS/apksigner sign \
  --ks "$BUILD_DIR/debug.keystore" \
  --ks-pass pass:android \
  --ks-key-alias androiddebugkey \
  --key-pass pass:android \
  --out "$BUILD_DIR/app-release-signed.apk" \
  "$BUILD_DIR/app-aligned.apk"

echo "=== Step 10: Copy to download/ ==="
mkdir -p /home/z/my-project/download
cp "$BUILD_DIR/app-release-signed.apk" "/home/z/my-project/download/${APK_NAME}.apk"

echo "=== Done! ==="
ls -la "/home/z/my-project/download/${APK_NAME}.apk"
file "/home/z/my-project/download/${APK_NAME}.apk"
