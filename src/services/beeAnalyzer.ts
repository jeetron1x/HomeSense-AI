import { Capacitor } from '@capacitor/core';
import { createWorker } from 'tesseract.js';

/**
 * Member 3's Vision Parsing and Cost Logic Data Contract
 */
export interface BeeAnalysisResult {
  success: boolean;
  appliance: string;
  applianceType: 'fridge' | 'hvac' | 'washer' | 'fan' | 'other';
  brand: string;
  model: string;
  wattage: number | null;
  annual_units_kwh: number | null;
  annualKwh: number;
  ratedWatts: number;
  star_rating: number | null;
  starRating: number;
  star_rating_source: 'ocr_text' | 'color_detection' | 'python_backend' | 'not_found';
  hours_used_per_day: number;
  tariff_rate: number;
  daily_units_kwh: number | null;
  estimated_daily_cost: number | null;
  estimated_monthly_cost: number | null;
  raw_ocr_text: string;
  source: 'python_backend' | 'on_device_tesseract' | 'on_device_mlkit' | 'client_vision';
  confidenceScore: number;
  capacity: string;
  capacityValue: number;
  capacityUnit: string;
  applianceTitle: string;
  error?: string;
  errorMessage?: string;
  rawNotes?: string;
}

export const DEFAULT_TARIFF_RATE = 8.0; // INR per unit (kWh)

const POPULAR_BRANDS = [
  'SAMSUNG',
  'LG',
  'WHIRLPOOL',
  'GODREJ',
  'HAIER',
  'VOLTAS',
  'DAIKIN',
  'BLUE STAR',
  'PANASONIC',
  'BOSCH',
  'IFB',
  'HITACHI',
  'CARRIER',
  'LLOYD',
  'ORIENT',
  'CROMPTON',
  'HAVELLS',
  'ATOMBERG',
  'BAJAJ',
  'USHA',
  'TOSHIBA',
  'ELECTROLUX',
  'MARQ',
  'REALME',
  'MI',
  'XIAOMI',
  'CANDY',
  'TCL',
  'HISENSE',
  'ONIDA',
];

/**
 * Fast RGB to HSV conversion
 * H: 0..360, S: 0..1, V: 0..1
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s, v];
}

/**
 * Member 3's Radial arc detector for Indian BEE energy labels ported to HTML5 Canvas.
 * Finds the black 'POWER SAVINGS GUIDE' banner, constructs the arc center & radius,
 * and samples the 5 radial star locations (left to right) for red/orange fill.
 */
export async function detectStarRatingByColor(
  imageDataUrl: string
): Promise<{ starRating: number | null; source: 'color_detection' | 'not_found' }> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve({ starRating: null, source: 'not_found' });

          ctx.drawImage(img, 0, 0, w, h);
          const topH = Math.floor(h * 0.55); // Top 55% where BEE arc resides
          const imageData = ctx.getImageData(0, 0, w, topH);
          const data = imageData.data;

          // 1. Locate the black "POWER SAVINGS GUIDE" banner
          let bestBar: { x: number; y: number; w: number; h: number } | null = null;
          let maxBarScore = 0;

          const step = Math.max(1, Math.floor(w / 120));
          for (let y = Math.floor(topH * 0.20); y < Math.floor(topH * 0.90); y += step * 2) {
            let darkRunStart = -1;
            for (let x = Math.floor(w * 0.05); x < Math.floor(w * 0.95); x += step) {
              const idx = (y * w + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

              if (brightness < 60) {
                if (darkRunStart === -1) darkRunStart = x;
              } else {
                if (darkRunStart !== -1) {
                  const runWidth = x - darkRunStart;
                  if (runWidth > w * 0.25 && runWidth > maxBarScore) {
                    maxBarScore = runWidth;
                    bestBar = {
                      x: darkRunStart,
                      y: y,
                      w: runWidth,
                      h: Math.max(10, Math.floor(runWidth * 0.18)),
                    };
                  }
                  darkRunStart = -1;
                }
              }
            }
          }

          // 2. Geometry construction for the semicircle arc
          let centerX: number;
          let centerY: number;
          let radius: number;

          if (bestBar) {
            centerX = bestBar.x + Math.floor(bestBar.w / 2);
            centerY = bestBar.y + Math.floor(bestBar.h * 0.20);
            radius = Math.floor(bestBar.w * 0.42);
          } else {
            // Fallback relative to image bounds
            centerX = Math.floor(w / 2);
            centerY = Math.floor(h * 0.38);
            radius = Math.floor(w * 0.22);
          }

          // 3. 5 radial anchor points from Star 1 (far left) to Star 5 (far right)
          const anglesDeg = [155, 122, 90, 58, 25];
          const sampleBoxR = Math.max(4, Math.floor(radius * 0.12));

          let starCount = 0;

          for (let i = 0; i < anglesDeg.length; i++) {
            const deg = anglesDeg[i];
            const rad = (deg * Math.PI) / 180.0;

            const sx = Math.floor(centerX - radius * Math.cos(rad));
            const sy = Math.floor(centerY - radius * Math.sin(rad));

            const y1 = Math.max(0, sy - sampleBoxR);
            const y2 = Math.min(topH, sy + sampleBoxR);
            const x1 = Math.max(0, sx - sampleBoxR);
            const x2 = Math.min(w, sx + sampleBoxR);

            let redPixels = 0;
            let totalPixels = 0;

            for (let py = y1; py < y2; py += 2) {
              for (let px = x1; px < x2; px += 2) {
                totalPixels++;
                const pIdx = (py * w + px) * 4;
                const r = data[pIdx];
                const g = data[pIdx + 1];
                const b = data[pIdx + 2];
                const [hue, sat, val] = rgbToHsv(r, g, b);

                // Red/Orange HSV mask covering BEE active star segments
                if ((hue < 22 || hue > 338) && sat > 0.28 && val > 0.25) {
                  redPixels++;
                }
              }
            }

            const redDensity = totalPixels > 0 ? redPixels / totalPixels : 0.0;

            // Star positions fill continuously from left to right on BEE labels
            if (redDensity > 0.15) {
              starCount++;
            } else {
              break;
            }
          }

          if (starCount >= 1 && starCount <= 5) {
            resolve({ starRating: starCount, source: 'color_detection' });
          } else {
            resolve({ starRating: null, source: 'not_found' });
          }
        } catch {
          resolve({ starRating: null, source: 'not_found' });
        }
      };
      img.onerror = () => resolve({ starRating: null, source: 'not_found' });
      img.src = imageDataUrl;
    } catch {
      resolve({ starRating: null, source: 'not_found' });
    }
  });
}

/**
 * Member 3's Regex Parsing Logic (verbatim from homrsense_ai.py)
 * Extracts wattage, annual units (kWh), and textual star ratings from OCR text.
 * Derives average operational wattage if only annual units are stated (common on fridges).
 */
export function parseLabelText(rawText: string): {
  wattage: number | null;
  annual_units: number | null;
  star_rating: number | null;
} {
  const result: {
    wattage: number | null;
    annual_units: number | null;
    star_rating: number | null;
  } = {
    wattage: null,
    star_rating: null,
    annual_units: null,
  };

  // 1. Direct Wattage extraction (e.g., "165W", "1500 Watts")
  let wattMatch = rawText.match(/(\d{2,5})\s*(?:W\b|Watts?\b)/i);
  if (!wattMatch) {
    wattMatch = rawText.match(/(?:Power|Input|Wattage|Consumption)[:\s]+(\d{2,5})/i);
  }
  if (wattMatch) {
    result.wattage = parseInt(wattMatch[1], 10);
  }

  // 2. Annual Consumption (e.g., "311* UNITS PER YEAR" or "ELECTRICITY CONSUMPTION 311")
  let unitsMatch = rawText.match(/(\d{2,4})\s*\*\s*\n?\s*UNITS\s+PER\s+YEAR/i);
  if (!unitsMatch) {
    unitsMatch = rawText.match(/ELECTRICITY\s+CONSUMPTION\D*(\d{2,4})/i);
  }
  if (unitsMatch) {
    const annualKwh = parseInt(unitsMatch[1], 10);
    result.annual_units = annualKwh;
    if (result.wattage === null) {
      // Average power = (Annual kWh / 8760 hours in a year) * 1000 W
      result.wattage = Math.round((annualKwh / 8760.0) * 1000);
    }
  }

  // 3. Textual Star fallback
  let starMatch = rawText.match(
    /(?:Rating|Star\s*Rating)?[:\s]*([1-5])\s*(?:star|st[a@4]r|stak|siar|\/\s*5)/i
  );
  if (!starMatch) {
    starMatch = rawText.match(/([1-5])\s*(?:STAR|ST[A@4]R|SIAR)/i);
  }
  if (!starMatch) {
    starMatch = rawText.match(/(?:STAR\s*RATING|RATING)[:\s]*([1-5])\b/i);
  }
  if (starMatch) {
    result.star_rating = parseInt(starMatch[1], 10);
  }

  return result;
}

/**
 * Member 3's Cost Calculation Engine (verbatim from homrsense_ai.py)
 * Computes daily units, daily cost, and monthly cost projections.
 */
export function calculateCost(
  wattage: number | null,
  hoursPerDay: number,
  tariffRate: number = DEFAULT_TARIFF_RATE
): {
  daily_units: number | null;
  daily_cost: number | null;
  monthly_cost: number | null;
} {
  if (wattage === null || wattage <= 0) {
    return { daily_units: null, daily_cost: null, monthly_cost: null };
  }

  const dailyUnits = Number(((wattage / 1000.0) * hoursPerDay).toFixed(3));
  const dailyCost = Number((dailyUnits * tariffRate).toFixed(2));
  const monthlyCost = Number((dailyCost * 30.0).toFixed(2));

  return {
    daily_units: dailyUnits,
    daily_cost: dailyCost,
    monthly_cost: monthlyCost,
  };
}

/**
 * Helper to identify appliance brand and category from text
 */
function extractApplianceMetadata(rawText: string) {
  const upper = rawText.toUpperCase();

  let applianceType: 'fridge' | 'hvac' | 'washer' | 'fan' | 'other' = 'fridge';
  if (/AIR\s*CONDITIONER|ROOM\s*AIR|SPLIT\s*AC|WINDOW\s*AC|INVERTER\s*AC|ISEER/i.test(upper)) {
    applianceType = 'hvac';
  } else if (/WASHING\s*MACHINE|WASHER|FRONT\s*LOAD|TOP\s*LOAD/i.test(upper)) {
    applianceType = 'washer';
  } else if (/CEILING\s*FAN|BLDC\s*FAN|FAN\s*SWEEP/i.test(upper)) {
    applianceType = 'fan';
  } else if (/REFRIGERATOR|DIRECT\s*COOL|FROST\s*FREE|FREEZER|STORAGE\s*VOLUME/i.test(upper)) {
    applianceType = 'fridge';
  }

  let brand = 'BEE Certified';
  for (const b of POPULAR_BRANDS) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(upper)) {
      brand = b.charAt(0) + b.slice(1).toLowerCase();
      if (['LG', 'IFB', 'TCL', 'MI'].includes(b)) brand = b;
      break;
    }
  }

  let model = 'BEE-' + Math.floor(1000 + Math.random() * 9000);
  const modelMatch = upper.match(/(?:MODEL|MOD)[:\s\-]+([A-Z0-9\-\/\. ]{3,20})/i);
  if (modelMatch && modelMatch[1].trim()) {
    model = modelMatch[1].trim().replace(/\s+/g, '-');
  }

  let capacity = 'Standard';
  let capacityValue = 250;
  let capacityUnit = 'Litres';
  if (applianceType === 'fridge') {
    const volMatch = upper.match(/(?:VOLUME|CAPACITY)[\s\:\-]+(\d{2,4})/i) || upper.match(/\b(\d{2,4})\s*L\b/i);
    if (volMatch) {
      capacityValue = parseInt(volMatch[1], 10);
      capacity = `${capacityValue} Litres`;
      capacityUnit = 'Litres';
    } else {
      capacity = '260 Litres';
      capacityValue = 260;
    }
  } else if (applianceType === 'hvac') {
    const tonMatch = upper.match(/\b(\d+(?:\.\d+)?)\s*TON/i);
    if (tonMatch) {
      capacityValue = parseFloat(tonMatch[1]);
      capacity = `${capacityValue} Ton`;
      capacityUnit = 'Ton';
    } else {
      capacity = '1.5 Ton';
      capacityValue = 1.5;
      capacityUnit = 'Ton';
    }
  }

  return { applianceType, brand, model, capacity, capacityValue, capacityUnit };
}

/**
 * End-to-End BEE Label Analysis
 * 1. Checks if local Python API server (homrsense_ai.py --server) is available.
 * 2. If available, uses Python OpenCV + Pytesseract backend results directly.
 * 3. If offline, runs Member 3's exact radial arc color detection and regex logic on-device.
 */
export async function analyzeBeeLabel(
  imageDataUrl: string,
  applianceName: string = 'Refrigerator',
  hoursUsedPerDay: number = 24.0,
  tariffRate: number = DEFAULT_TARIFF_RATE
): Promise<BeeAnalysisResult> {
  // Step 1: Attempt to communicate with the local homrsense_ai.py backend API
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageDataUrl,
        appliance: applianceName,
        hours: hoursUsedPerDay,
        tariff_rate: tariffRate,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && (data.wattage !== undefined || data.star_rating !== undefined)) {
        const meta = extractApplianceMetadata(data.raw_ocr_text || applianceName);
        const validStars = Math.max(1, Math.min(5, data.star_rating || 3));
        const effectiveWatts = data.wattage || Math.round(((data.annual_units_kwh || 240) / 8760.0) * 1000);
        const cost = calculateCost(effectiveWatts, hoursUsedPerDay, tariffRate);

        return {
          success: true,
          appliance: data.appliance || applianceName,
          applianceType: meta.applianceType,
          brand: meta.brand,
          model: meta.model,
          wattage: effectiveWatts,
          annual_units_kwh: data.annual_units_kwh,
          annualKwh: data.annual_units_kwh || 240,
          ratedWatts: effectiveWatts,
          star_rating: data.star_rating,
          starRating: validStars,
          star_rating_source: data.star_rating_source || 'python_backend',
          hours_used_per_day: hoursUsedPerDay,
          tariff_rate: tariffRate,
          daily_units_kwh: cost.daily_units,
          estimated_daily_cost: cost.daily_cost,
          estimated_monthly_cost: cost.monthly_cost,
          raw_ocr_text: data.raw_ocr_text || '',
          source: 'python_backend',
          confidenceScore: 95,
          capacity: meta.capacity,
          capacityValue: meta.capacityValue,
          capacityUnit: meta.capacityUnit,
          applianceTitle: `${meta.brand} ${meta.capacity} ${data.appliance || applianceName}`,
          rawNotes: 'Analyzed via Member 3 homrsense_ai.py Python Engine',
        };
      }
    }
  } catch (backendErr) {
    // Local Python backend not running or unreachable — gracefully execute on-device pipeline!
  }

  // Step 2: On-device execution of Member 3's pipeline
  let rawOcrText = '';
  let engineSource: 'on_device_mlkit' | 'on_device_tesseract' | 'client_vision' = 'client_vision';

  // 2a. Check Native Android ML Kit OCR if on mobile
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await (Capacitor as any).Plugins?.BeeVision?.recognizeText({
        imageBase64: imageDataUrl,
      });
      if (result && result.text) {
        rawOcrText = result.text;
        engineSource = 'on_device_mlkit';
      }
    } catch (e) {
      console.warn('Native ML Kit OCR fallback:', e);
    }
  }

  // 2b. Run Tesseract.js in browser if ML Kit wasn't used
  if (!rawOcrText || rawOcrText.trim().length < 5) {
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageDataUrl);
      rawOcrText = ret.data.text || '';
      await worker.terminate();
      engineSource = 'on_device_tesseract';
    } catch (tessErr) {
      console.warn('Tesseract OCR fallback:', tessErr);
    }
  }

  // 2c. Member 3's Text Regex Parser
  const parsed = parseLabelText(rawOcrText);

  // 2d. Member 3's Radial Arc Star Color Detection
  let starRating = parsed.star_rating;
  let starSource: 'ocr_text' | 'color_detection' | 'not_found' = 'ocr_text';

  if (starRating === null) {
    const colorResult = await detectStarRatingByColor(imageDataUrl);
    if (colorResult.starRating !== null) {
      starRating = colorResult.starRating;
      starSource = 'color_detection';
    } else {
      starSource = 'not_found';
    }
  }

  // Baseline star safety fallback if neither source found it
  const finalStarRating = starRating ? Math.max(1, Math.min(5, starRating)) : 3;

  // 2e. Member 3's Cost Calculation
  const cost = calculateCost(parsed.wattage, hoursUsedPerDay, tariffRate);
  const meta = extractApplianceMetadata(rawOcrText);

  const effectiveAnnualUnits = parsed.annual_units || (parsed.wattage ? Math.round((parsed.wattage * 8760) / 1000) : 230);
  const effectiveWatts = parsed.wattage || Math.round((effectiveAnnualUnits / 8760.0) * 1000);

  return {
    success: true,
    appliance: applianceName,
    applianceType: meta.applianceType,
    brand: meta.brand,
    model: meta.model,
    wattage: effectiveWatts,
    annual_units_kwh: parsed.annual_units,
    annualKwh: effectiveAnnualUnits,
    ratedWatts: effectiveWatts,
    star_rating: starRating,
    starRating: finalStarRating,
    star_rating_source: starSource,
    hours_used_per_day: hoursUsedPerDay,
    tariff_rate: tariffRate,
    daily_units_kwh: cost.daily_units,
    estimated_daily_cost: cost.daily_cost,
    estimated_monthly_cost: cost.monthly_cost,
    raw_ocr_text: rawOcrText,
    source: engineSource,
    confidenceScore: starRating ? 90 : 75,
    capacity: meta.capacity,
    capacityValue: meta.capacityValue,
    capacityUnit: meta.capacityUnit,
    applianceTitle: `${meta.brand} ${meta.capacity} ${applianceName}`,
    rawNotes: `Member 3 On-Device Vision Engine (${starSource})`,
  };
}

/**
 * Generates human-readable Markdown Report matching Member 3's export_markdown
 */
export function generateMarkdownReport(report: Partial<BeeAnalysisResult>): string {
  const wattStr = report.wattage ? `${report.wattage} W` : 'Not Detected';
  const starStr = report.star_rating ? `${report.star_rating} Star` : `${report.starRating || 3} Star`;
  const annualStr = report.annual_units_kwh ? `${report.annual_units_kwh} kWh/year` : `${report.annualKwh || 'N/A'} kWh/year`;
  const unitsStr = report.daily_units_kwh ? `${report.daily_units_kwh} kWh` : 'N/A';
  const dCostStr = report.estimated_daily_cost ? `INR ${report.estimated_daily_cost}` : 'N/A';
  const mCostStr = report.estimated_monthly_cost ? `INR ${report.estimated_monthly_cost}` : 'N/A';

  return (
    `# HomeSense AI - Energy Audit Report\n\n` +
    `**Appliance:** ${report.appliance || 'Appliance'}\n` +
    `**Wattage:** ${wattStr}\n` +
    `**Annual Consumption:** ${annualStr}\n` +
    `**Star Rating:** ${starStr} (source: ${report.star_rating_source || 'on-device'})\n` +
    `**Usage:** ${report.hours_used_per_day || 24.0} hours/day\n` +
    `**Tariff Rate:** INR ${report.tariff_rate || DEFAULT_TARIFF_RATE} / kWh\n\n` +
    `## Cost Estimate\n` +
    `- Daily units consumed: ${unitsStr}\n` +
    `- Estimated daily cost: ${dCostStr}\n` +
    `- **Estimated monthly cost: ${mCostStr}**\n`
  );
}

/**
 * Triggers a browser download of a JSON or Markdown file
 */
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}