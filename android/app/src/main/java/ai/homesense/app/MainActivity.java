package ai.homesense.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebSettings;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int SENSOR_PERMS_REQUEST_CODE = 2001;
    private PermissionRequest pendingWebPermissionRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BeeVisionPlugin.class);
        super.onCreate(savedInstanceState);

        // Proactively request native Camera, Audio, and Audio Settings hardware permissions
        requestDeviceSensorPermissions();
        configureWebView();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebView();
    }

    private void configureWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebSettings settings = getBridge().getWebView().getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setDomStorageEnabled(true);

            final android.webkit.WebChromeClient defaultClient = getBridge().getWebView().getWebChromeClient();

            getBridge().getWebView().setWebChromeClient(new android.webkit.WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        try {
                            request.grant(request.getResources());
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
                }

                @Override
                public boolean onShowFileChooser(android.webkit.WebView webView, android.webkit.ValueCallback<android.net.Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                    if (defaultClient != null) {
                        return defaultClient.onShowFileChooser(webView, filePathCallback, fileChooserParams);
                    }
                    return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
                }

                @Override
                public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                    if (defaultClient != null) {
                        return defaultClient.onConsoleMessage(consoleMessage);
                    }
                    return super.onConsoleMessage(consoleMessage);
                }
            });
        }
    }

    private void requestDeviceSensorPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            String[] permissions = {
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.MODIFY_AUDIO_SETTINGS
            };
            List<String> missing = new ArrayList<>();
            for (String perm : permissions) {
                if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                    missing.add(perm);
                }
            }
            if (!missing.isEmpty()) {
                ActivityCompat.requestPermissions(this, missing.toArray(new String[0]), SENSOR_PERMS_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == SENSOR_PERMS_REQUEST_CODE) {
            if (pendingWebPermissionRequest != null) {
                try {
                    pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
                } catch (Exception e) {
                    e.printStackTrace();
                }
                pendingWebPermissionRequest = null;
            }
        }
    }
}
