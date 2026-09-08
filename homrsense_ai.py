"""
HomeSense AI - Vision Parsing + Cost Logic (Member 3's part)
---------------------------------------------------------------
Pipeline:
  1. Take a photo of an appliance's energy label
  2. Preprocess the image for reliable OCR on real photos
  3. Run OCR to extract raw text (Wattage / Annual kWh / Star texts)
  4. Parse text using regex (derives average wattage from Annual Units if Wattage is omitted)
  5. Radial arc color detection for Indian BEE labels:
     - Detects the black "POWER SAVINGS GUIDE" banner
     - Samples the 5 radial positions along the upper semicircle arc
     - Distinguishes active red/orange star segments from inactive white/grey segments
  6. Calculate estimated daily/monthly electricity cost
  7. Export JSON and Markdown audit reports
  8. Integrated API server mode (--server) for web/app integration
"""

import os
import re
import sys
import json
import base64
import tempfile
import shutil
import platform
from typing import Optional, Dict, Any

import numpy as np
import cv2
import pytesseract
from PIL import Image

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    HEIC_SUPPORTED = True
except ImportError:
    HEIC_SUPPORTED = False

try:
    from audio_analyzer import HomeSenseAudioAnalyzer
    AUDIO_ANALYZER_AVAILABLE = True
except ImportError:
    try:
        from extracted_homesenseai.homesenseai.audio_analyzer import HomeSenseAudioAnalyzer
        AUDIO_ANALYZER_AVAILABLE = True
    except ImportError:
        AUDIO_ANALYZER_AVAILABLE = False

# Auto-locate Tesseract across OS platforms to prevent PATH missing errors
if platform.system() == "Windows":
    win_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
    ]
    for path in win_paths:
        if os.path.isfile(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break
else:
    tesseract_bin = shutil.which("tesseract")
    if tesseract_bin:
        pytesseract.pytesseract.tesseract_cmd = tesseract_bin

DEFAULT_TARIFF_RATE = 8.0  # INR per unit (kWh)
SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp", ".heic", ".heif"]


def resolve_photo_path(photo_path: str) -> str:
    """Find the target image file or fallback to supported alternatives in the same directory."""
    if os.path.isfile(photo_path):
        return photo_path

    base, _ = os.path.splitext(photo_path)
    folder = os.path.dirname(photo_path) or "."
    base_name = os.path.basename(base)

    for ext in SUPPORTED_EXTENSIONS:
        candidate = os.path.join(folder, base_name + ext)
        if os.path.isfile(candidate):
            return candidate

    try:
        files_here = [
            f for f in os.listdir(folder)
            if os.path.splitext(f)[1].lower() in SUPPORTED_EXTENSIONS
        ]
    except OSError:
        files_here = []

    hint = (
        f" Image files found in directory: {files_here}"
        if files_here else " No compatible image files found in directory."
    )
    raise FileNotFoundError(
        f"Could not find '{photo_path}' in '{os.path.abspath(folder)}'.{hint}"
    )


def _load_image_cv(image_path: str) -> np.ndarray:
    """Load an image file safely into a BGR OpenCV NumPy array."""
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Image not found at path: '{image_path}'")

    ext = os.path.splitext(image_path)[1].lower()
    if ext in (".heic", ".heif") and not HEIC_SUPPORTED:
        raise RuntimeError(
            f"'{image_path}' is a HEIC/HEIF file. Install 'pillow-heif' to process: pip install pillow-heif"
        )

    try:
        with Image.open(image_path) as pil_img:
            rgb_img = pil_img.convert("RGB")
            return cv2.cvtColor(np.array(rgb_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise RuntimeError(f"Failed to decode image '{image_path}': {e}")


def preprocess_for_ocr(img_cv: np.ndarray) -> np.ndarray:
    """Preprocess image with grayscale, scaling, denoising, and adaptive thresholding."""
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    h, w = gray.shape[:2]
    if max(h, w) < 2000:
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    thresh = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
    )
    return thresh


def extract_text_from_image(image_path: str) -> str:
    """Run OCR extraction with fallback to raw color image if thresholding erases text."""
    img_cv = _load_image_cv(image_path)
    processed = preprocess_for_ocr(img_cv)
    ocr_config = "--psm 6"

    try:
        raw_text = pytesseract.image_to_string(Image.fromarray(processed), config=ocr_config)
    except pytesseract.TesseractNotFoundError:
        raw_text = ""
    except Exception as e:
        raw_text = ""

    if len(raw_text.strip()) < 5:
        try:
            with Image.open(image_path) as fallback_img:
                raw_text = pytesseract.image_to_string(fallback_img.convert("RGB"), config=ocr_config)
        except Exception:
            pass

    return raw_text


def parse_label_text(raw_text: str) -> Dict[str, Optional[int]]:
    """
    Extract wattage, annual units (kWh), and textual star ratings from OCR.
    Computes average operational wattage if only annual units are stated (common on fridges).
    """
    result: Dict[str, Optional[int]] = {
        "wattage": None,
        "star_rating": None,
        "annual_units": None
    }

    # 1. Direct Wattage extraction (e.g., "165W", "1500 Watts")
    watt_match = re.search(r'(\d{2,5})\s*(?:W\b|Watts?\b)', raw_text, re.IGNORECASE)
    if not watt_match:
        watt_match = re.search(r'(?:Power|Input|Wattage|Consumption)[:\s]+(\d{2,5})', raw_text, re.IGNORECASE)
    if watt_match:
        result["wattage"] = int(watt_match.group(1))

    # 2. Annual Consumption (e.g., "311* UNITS PER YEAR" or "ELECTRICITY CONSUMPTION 311")
    units_match = re.search(r'(\d{2,4})\s*\*\s*\n?\s*UNITS\s+PER\s+YEAR', raw_text, re.IGNORECASE)
    if not units_match:
        units_match = re.search(r'ELECTRICITY\s+CONSUMPTION\D*(\d{2,4})', raw_text, re.IGNORECASE)
    if units_match:
        annual_kwh = int(units_match.group(1))
        result["annual_units"] = annual_kwh
        if result["wattage"] is None:
            # Average power = (Annual kWh / 8760 hours in a year) * 1000 W
            result["wattage"] = round((annual_kwh / 8760.0) * 1000)

    # 3. Textual Star fallback
    star_match = re.search(
        r'(?:Rating|Star\s*Rating)?[:\s]*([1-5])\s*(?:star|st[a@4]r|stak|siar|\/\s*5)',
        raw_text,
        re.IGNORECASE
    )
    if not star_match:
        star_match = re.search(r'([1-5])\s*(?:STAR|ST[A@4]R|SIAR)', raw_text, re.IGNORECASE)
    if not star_match:
        star_match = re.search(r'(?:STAR\s*RATING|RATING)[:\s]*([1-5])\b', raw_text, re.IGNORECASE)

    if star_match:
        result["star_rating"] = int(star_match.group(1))

    return result


def detect_star_rating_by_color(image_path: str, debug: bool = False) -> Optional[int]:
    """
    Radial arc detector for Indian BEE energy labels.
    Finds the black 'POWER SAVINGS GUIDE' banner, constructs the arc center,
    and samples the 5 radial star locations (left to right) for red/orange fill.
    """
    try:
        img_cv = _load_image_cv(image_path)
    except Exception:
        return None

    h, w = img_cv.shape[:2]
    # Crop to top 55% where the BEE header arc resides
    top_region = img_cv[0:int(h * 0.55), :]
    gray = cv2.cvtColor(top_region, cv2.COLOR_BGR2GRAY)

    # Locate the solid black "POWER SAVINGS GUIDE" bar
    _, dark_thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(dark_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    guide_bar = None
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect_ratio = bw / float(bh) if bh > 0 else 0
        # The horizontal bar has an aspect ratio between 2.5 and 7.0
        if 2.5 < aspect_ratio < 7.0 and bw > (w * 0.25):
            guide_bar = (x, y, bw, bh)
            break

    # Geometry construction for the semicircle arc
    if guide_bar:
        bx, by, bw, bh = guide_bar
        center_x = bx + (bw // 2)
        center_y = by + int(bh * 0.20)
        radius = int(bw * 0.42)
    else:
        # Fallback relative to image bounds if contour misses
        center_x = w // 2
        center_y = int(h * 0.38)
        radius = int(w * 0.22)

    # Red/orange HSV mask covering BEE background fills
    hsv = cv2.cvtColor(top_region, cv2.COLOR_BGR2HSV)
    lower_red1, upper_red1 = np.array([0, 70, 50]), np.array([12, 255, 255])
    lower_red2, upper_red2 = np.array([165, 70, 50]), np.array([180, 255, 255])
    mask_red = cv2.inRange(hsv, lower_red1, upper_red1) | cv2.inRange(hsv, lower_red2, upper_red2)

    kernel = np.ones((3, 3), np.uint8)
    mask_red = cv2.morphologyEx(mask_red, cv2.MORPH_OPEN, kernel)

    # 5 radial anchor points from Star 1 (far left) to Star 5 (far right)
    angles_deg = [155, 122, 90, 58, 25]
    sample_box_r = max(5, int(radius * 0.12))

    star_count = 0
    vis = top_region.copy() if debug else None

    for i, deg in enumerate(angles_deg):
        rad = np.deg2rad(deg)
        # Semicircle radial projection
        sx = int(center_x - radius * np.cos(rad))
        sy = int(center_y - radius * np.sin(rad))

        y1, y2 = max(0, sy - sample_box_r), min(top_region.shape[0], sy + sample_box_r)
        x1, x2 = max(0, sx - sample_box_r), min(top_region.shape[1], sx + sample_box_r)
        patch = mask_red[y1:y2, x1:x2]

        red_density = (cv2.countNonZero(patch) / patch.size) if patch.size > 0 else 0.0

        if debug and vis is not None:
            color = (0, 255, 0) if red_density > 0.15 else (0, 0, 255)
            cv2.rectangle(vis, (x1, y1), (x2, y2), color, 2)
            cv2.putText(vis, f"S{i+1}:{red_density:.2f}", (x1, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

        # Star positions fill continuously from left to right on BEE labels
        if red_density > 0.15:
            star_count += 1
        else:
            break

    if debug and vis is not None:
        cv2.imwrite("debug_bee_star_arc.png", vis)
        cv2.imwrite("debug_red_mask.png", mask_red)

    return star_count if 1 <= star_count <= 5 else None


def calculate_cost(
    wattage: Optional[int],
    hours_per_day: float,
    tariff_rate: float = DEFAULT_TARIFF_RATE
) -> Dict[str, Optional[float]]:
    """Compute daily units, daily cost, and monthly cost projections."""
    if wattage is None or wattage <= 0:
        return {"daily_units": None, "daily_cost": None, "monthly_cost": None}

    daily_units = (wattage / 1000.0) * hours_per_day
    daily_cost = daily_units * tariff_rate
    monthly_cost = daily_cost * 30.0

    return {
        "daily_units": round(daily_units, 3),
        "daily_cost": round(daily_cost, 2),
        "monthly_cost": round(monthly_cost, 2),
    }


def build_report(
    appliance_name: str,
    image_path: str,
    hours_per_day: float,
    tariff_rate: float = DEFAULT_TARIFF_RATE,
    debug: bool = False
) -> Dict[str, Any]:
    """Execute end-to-end evaluation pipeline and build formatted data dictionary."""
    valid_path = resolve_photo_path(image_path)
    raw_text = extract_text_from_image(valid_path)
    parsed = parse_label_text(raw_text)

    star_source = "ocr_text"
    if parsed["star_rating"] is None:
        color_rating = detect_star_rating_by_color(valid_path, debug=debug)
        if color_rating is not None:
            parsed["star_rating"] = color_rating
            star_source = "color_detection"
        else:
            star_source = "not_found"

    cost = calculate_cost(parsed["wattage"], hours_per_day, tariff_rate)

    return {
        "success": True,
        "appliance": appliance_name,
        "wattage": parsed["wattage"],
        "annual_units_kwh": parsed["annual_units"],
        "star_rating": parsed["star_rating"],
        "star_rating_source": star_source,
        "hours_used_per_day": hours_per_day,
        "tariff_rate": tariff_rate,
        "daily_units_kwh": cost["daily_units"],
        "estimated_daily_cost": cost["daily_cost"],
        "estimated_monthly_cost": cost["monthly_cost"],
        "raw_ocr_text": raw_text.strip(),
    }


def export_json(report: Dict[str, Any], out_path: str = "report.json") -> None:
    """Save pipeline results to a UTF-8 JSON file."""
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"JSON report saved to {out_path}")


def export_markdown(report: Dict[str, Any], out_path: str = "report.md") -> str:
    """Save human-readable markdown breakdown and return string."""
    watt_str = f"{report['wattage']} W" if report.get('wattage') is not None else "Not Detected"
    star_str = f"{report['star_rating']} Star" if report.get('star_rating') is not None else "Not Detected"
    annual_str = f"{report['annual_units_kwh']} kWh/year" if report.get('annual_units_kwh') is not None else "N/A"
    units_str = f"{report['daily_units_kwh']} kWh" if report.get('daily_units_kwh') is not None else "N/A"
    d_cost_str = f"INR {report['estimated_daily_cost']}" if report.get('estimated_daily_cost') is not None else "N/A"
    m_cost_str = f"INR {report['estimated_monthly_cost']}" if report.get('estimated_monthly_cost') is not None else "N/A"

    md = (
        f"# HomeSense AI - Energy Audit Report\n\n"
        f"**Appliance:** {report.get('appliance', 'Appliance')}\n"
        f"**Wattage:** {watt_str}\n"
        f"**Annual Consumption:** {annual_str}\n"
        f"**Star Rating:** {star_str} (source: {report.get('star_rating_source', 'N/A')})\n"
        f"**Usage:** {report.get('hours_used_per_day', 24.0)} hours/day\n"
        f"**Tariff Rate:** INR {report.get('tariff_rate', DEFAULT_TARIFF_RATE)} / kWh\n\n"
        f"## Cost Estimate\n"
        f"- Daily units consumed: {units_str}\n"
        f"- Estimated daily cost: {d_cost_str}\n"
        f"- **Estimated monthly cost: {m_cost_str}**\n"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"Markdown report saved to {out_path}")
    return md


# -------------------------------------------------------------
# Integrated API Server (FastAPI / Uvicorn) for App Integration
# -------------------------------------------------------------
def create_app():
    """Create and configure FastAPI microservice exposing vision, cost, and audio ML pipelines."""
    try:
        from fastapi import FastAPI, UploadFile, File, Form, Body
        from fastapi.middleware.cors import CORSMiddleware
    except ImportError:
        return None

    app = FastAPI(title="HomeSense AI Vision, Cost & Audio ML Service", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    @app.get("/api/health")
    def health_check():
        return {
            "status": "ok",
            "service": "HomeSense AI Vision, Cost & Audio ML Engine",
            "heic_supported": HEIC_SUPPORTED,
            "audio_analyzer_ready": AUDIO_ANALYZER_AVAILABLE,
        }

    @app.post("/api/analyze")
    async def analyze_endpoint(payload: Dict[str, Any] = Body(...)):
        """
        Analyze an energy label image sent as base64 or photo_path.
        Payload keys:
          - image_base64: data:image/jpeg;base64,... or raw base64
          - photo_path: optional path on disk
          - appliance: optional appliance name (default 'Appliance')
          - hours: optional hours per day (default 24.0)
          - tariff_rate: optional tariff (default 8.0)
        """
        appliance_name = payload.get("appliance", "Appliance")
        hours = float(payload.get("hours", payload.get("hours_used_per_day", 24.0)))
        tariff = float(payload.get("tariff_rate", DEFAULT_TARIFF_RATE))
        image_base64 = payload.get("image_base64")
        photo_path = payload.get("photo_path")

        temp_file_path = None
        try:
            if image_base64:
                if "," in image_base64:
                    image_base64 = image_base64.split(",", 1)[1]
                img_data = base64.b64decode(image_base64)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
                    tmp.write(img_data)
                    temp_file_path = tmp.name
                target = temp_file_path
            elif photo_path:
                target = photo_path
            else:
                return {"success": False, "error": "No image_base64 or photo_path provided."}

            report = build_report(appliance_name, target, hours, tariff, debug=False)
            return report
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except OSError:
                    pass

    @app.post("/api/upload-analyze")
    async def upload_analyze_endpoint(
        file: UploadFile = File(...),
        appliance: str = Form("Appliance"),
        hours: float = Form(24.0),
        tariff_rate: float = Form(DEFAULT_TARIFF_RATE),
    ):
        """Analyze an uploaded multipart/form-data image file."""
        ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                content = await file.read()
                tmp.write(content)
                temp_file_path = tmp.name

            report = build_report(appliance, temp_file_path, hours, tariff_rate, debug=False)
            return report
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except OSError:
                    pass

    @app.post("/api/export-markdown")
    def export_md_endpoint(payload: Dict[str, Any] = Body(...)):
        out_path = payload.get("out_path", "report.md")
        content = export_markdown(payload.get("report", {}), out_path=out_path)
        return {"success": True, "markdown": content, "saved_to": out_path}

    @app.post("/api/audio/analyze")
    async def audio_analyze_endpoint(payload: Dict[str, Any] = Body(...)):
        """
        Analyze audio snippet sent as base64 or wav_path.
        Payload keys:
          - audio_base64: data:audio/wav;base64,... or raw base64
          - wav_path: optional path on disk
        """
        if not AUDIO_ANALYZER_AVAILABLE:
            return {"success": False, "error": "HomeSenseAudioAnalyzer module not available."}

        audio_base64 = payload.get("audio_base64")
        wav_path = payload.get("wav_path")
        temp_file_path = None

        try:
            if audio_base64:
                if "," in audio_base64:
                    audio_base64 = audio_base64.split(",", 1)[1]
                audio_bytes = base64.b64decode(audio_base64)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                    tmp.write(audio_bytes)
                    temp_file_path = tmp.name
                target = temp_file_path
            elif wav_path and os.path.exists(wav_path):
                target = wav_path
            else:
                return {"success": False, "error": "No valid audio_base64 or wav_path provided."}

            analyzer = HomeSenseAudioAnalyzer()
            result = analyzer.analyze_audio_file(target)
            result["success"] = True
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except OSError:
                    pass

    @app.post("/api/audio/upload-analyze")
    async def upload_audio_analyze_endpoint(file: UploadFile = File(...)):
        """Analyze an uploaded multipart/form-data audio file."""
        if not AUDIO_ANALYZER_AVAILABLE:
            return {"success": False, "error": "HomeSenseAudioAnalyzer module not available."}

        ext = os.path.splitext(file.filename or "")[1] or ".wav"
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                content = await file.read()
                tmp.write(content)
                temp_file_path = tmp.name

            analyzer = HomeSenseAudioAnalyzer()
            result = analyzer.analyze_audio_file(temp_file_path)
            result["success"] = True
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except OSError:
                    pass

    return app


app = create_app()


def run_server(port: int = 8000, host: str = "0.0.0.0"):
    """Launch FastAPI microservice exposing vision, cost, and audio ML pipelines."""
    try:
        import uvicorn
    except ImportError:
        print("Uvicorn not installed. Please install: pip install uvicorn")
        sys.exit(1)

    server_app = app or create_app()
    if not server_app:
        print("FastAPI not installed. Please install: pip install fastapi")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f"  HomeSense AI Vision, Cost & Audio ML Engine Server")
    print(f"  Running on: http://localhost:{port}")
    print(f"  Endpoints: /api/analyze, /api/audio/analyze, /api/health")
    print(f"=======================================================\n")

    uvicorn.run(server_app, host=host, port=port)


if __name__ == "__main__":
    # Check for server mode
    if "--server" in sys.argv or "-s" in sys.argv:
        port_num = 8000
        for arg in sys.argv:
            if arg.isdigit():
                port_num = int(arg)
        run_server(port=port_num)
        sys.exit(0)

    # Check for audio analyzer CLI mode
    if "--audio" in sys.argv:
        idx = sys.argv.index("--audio")
        wav_target = sys.argv[idx + 1] if len(sys.argv) > idx + 1 else "test_sample.wav"
        if not AUDIO_ANALYZER_AVAILABLE:
            print("ERROR: HomeSenseAudioAnalyzer module could not be imported.", file=sys.stderr)
            sys.exit(1)
        analyzer = HomeSenseAudioAnalyzer()
        res = analyzer.analyze_audio_file(wav_target)
        print(json.dumps(res, indent=2))
        sys.exit(0)

    # Standalone CLI mode
    if len(sys.argv) >= 2 and not sys.argv[1].startswith("-"):
        target_path = sys.argv[1]
        name = sys.argv[2] if len(sys.argv) >= 3 else "Appliance"
        try:
            hours = float(sys.argv[3]) if len(sys.argv) >= 4 else 24.0
        except ValueError:
            print(f"Invalid hours argument '{sys.argv[3]}'. Defaulting to 24.0.")
            hours = 24.0
    else:
        target_path = "sample_label.jpg"
        name = "Refrigerator"
        hours = 24.0

    try:
        report_data = build_report(name, target_path, hours, debug=False)
        print(json.dumps(report_data, indent=2))
        export_json(report_data, "report.json")
        export_markdown(report_data, "report.md")
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
