package ai.homesense.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.util.Base64;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

@CapacitorPlugin(name = "BeeVision")
public class BeeVisionPlugin extends Plugin {
    private TextRecognizer textRecognizer;

    @Override
    public void load() {
        super.load();
        try {
            textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PluginMethod
    public void requestAudioPermission(PluginCall call) {
        try {
            boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
            if (granted) {
                JSObject ret = new JSObject();
                ret.put("granted", true);
                call.resolve(ret);
            } else {
                ActivityCompat.requestPermissions(getActivity(), new String[]{
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.MODIFY_AUDIO_SETTINGS
                }, 3001);
                JSObject ret = new JSObject();
                ret.put("granted", false);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Audio permission error: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void recognizeText(PluginCall call) {
        String base64Data = call.getString("imageBase64");
        if (base64Data == null || base64Data.trim().isEmpty()) {
            call.reject("Image data missing");
            return;
        }

        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }

        try {
            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
            if (bitmap == null) {
                call.reject("Failed to decode image into Bitmap");
                return;
            }

            if (textRecognizer == null) {
                textRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            }

            InputImage image = InputImage.fromBitmap(bitmap, 0);
            textRecognizer.process(image)
                .addOnSuccessListener(visionText -> {
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("text", visionText.getText());
                    
                    int visualStars = detectStarsFromArch(bitmap);
                    ret.put("visualStars", visualStars);
                    
                    call.resolve(ret);
                })
                .addOnFailureListener(e -> {
                    call.reject("ML Kit OCR failed: " + e.getMessage(), e);
                });
        } catch (Exception e) {
            call.reject("Exception in BeeVisionPlugin: " + e.getMessage(), e);
        }
    }

    /**
     * Radial arc color detector for Indian BEE energy labels (Member 3 homrsense_ai.py algorithm).
     * Finds the black "POWER SAVINGS GUIDE" banner, constructs the arc center,
     * and samples the 5 radial star locations (left to right) for red/orange fill.
     */
    private int detectStarsFromArch(Bitmap bitmap) {
        try {
            int width = bitmap.getWidth();
            int height = bitmap.getHeight();
            if (width < 50 || height < 50) return 0;

            int topHeight = (int) (height * 0.55);

            // 1. Locate the solid black "POWER SAVINGS GUIDE" bar
            int guideBx = 0, guideBy = 0, guideBw = 0, guideBh = 0;
            boolean guideFound = false;

            int step = Math.max(1, width / 120);
            for (int y = (int)(topHeight * 0.20); y < (int)(topHeight * 0.90); y += step * 2) {
                int darkRunStart = -1;
                for (int x = (int)(width * 0.05); x < (int)(width * 0.95); x += step) {
                    int pixel = bitmap.getPixel(x, y);
                    int r = Color.red(pixel);
                    int g = Color.green(pixel);
                    int b = Color.blue(pixel);
                    double brightness = 0.299 * r + 0.587 * g + 0.114 * b;

                    if (brightness < 60) {
                        if (darkRunStart == -1) darkRunStart = x;
                    } else {
                        if (darkRunStart != -1) {
                            int runWidth = x - darkRunStart;
                            if (runWidth > width * 0.25 && runWidth > guideBw) {
                                guideBx = darkRunStart;
                                guideBy = y;
                                guideBw = runWidth;
                                guideBh = Math.max(10, (int)(runWidth * 0.18));
                                guideFound = true;
                            }
                            darkRunStart = -1;
                        }
                    }
                }
            }

            // 2. Semicircle arc geometry construction (homrsense_ai.py)
            int centerX, centerY, radius;
            if (guideFound) {
                centerX = guideBx + (guideBw / 2);
                centerY = guideBy + (int)(guideBh * 0.20);
                radius = (int)(guideBw * 0.42);
            } else {
                centerX = width / 2;
                centerY = (int)(height * 0.38);
                radius = (int)(width * 0.22);
            }

            // 3. 5 radial anchor points from Star 1 (far left) to Star 5 (far right)
            int[] anglesDeg = new int[]{155, 122, 90, 58, 25};
            int sampleBoxR = Math.max(4, (int)(radius * 0.12));

            float[] hsv = new float[3];
            int starCount = 0;

            for (int deg : anglesDeg) {
                double rad = Math.toRadians(deg);
                int sx = (int)(centerX - radius * Math.cos(rad));
                int sy = (int)(centerY - radius * Math.sin(rad));

                int y1 = Math.max(0, sy - sampleBoxR);
                int y2 = Math.min(topHeight, sy + sampleBoxR);
                int x1 = Math.max(0, sx - sampleBoxR);
                int x2 = Math.min(width, sx + sampleBoxR);

                int redPixels = 0;
                int totalPixels = 0;

                for (int py = y1; py < y2; py += 2) {
                    for (int px = x1; px < x2; px += 2) {
                        totalPixels++;
                        int pixel = bitmap.getPixel(px, py);
                        Color.colorToHSV(pixel, hsv);
                        float hue = hsv[0];
                        float sat = hsv[1];
                        float val = hsv[2];

                        // Red/orange HSV mask covering BEE background fills (Member 3)
                        if ((hue < 22 || hue > 338) && sat > 0.28f && val > 0.25f) {
                            redPixels++;
                        }
                    }
                }

                double redDensity = totalPixels > 0 ? (double) redPixels / totalPixels : 0.0;

                // Star positions fill continuously from left to right on BEE labels
                if (redDensity > 0.15) {
                    starCount++;
                } else {
                    break;
                }
            }

            return (starCount >= 1 && starCount <= 5) ? starCount : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
