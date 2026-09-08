import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { AcousticTelemetry, ThemeMode } from '../types.ts';
import { triggerHaptic } from '../utils/haptics.ts';
import {
  HomeSenseOnDeviceAudioAnalyzer,
  AudioAnalysisPayload,
  TARGET_EVENTS,
} from '../services/audioAnalyzer.ts';

interface MonitorViewProps {
  onShowToast: (msg: string) => void;
  telemetry: AcousticTelemetry;
  onUpdateTelemetry: (updated: Partial<AcousticTelemetry>) => void;
  onTriggerAnomalyAlert: (name: string) => void;
  theme?: ThemeMode;
}

export const MonitorView: React.FC<MonitorViewProps> = ({
  onShowToast,
  telemetry,
  onUpdateTelemetry,
  onTriggerAnomalyAlert,
  theme = 'dark',
}) => {
  const [isMicStreamActive, setIsMicStreamActive] = useState<boolean>(false);
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>([25, 45, 60, 80, 65, 50, 35, 20, 15, 10]);
  const [curveD, setCurveD] = useState<string>('M 0 70 Q 30 50, 60 70 T 120 70 T 180 70 T 240 70 T 300 70 T 340 70');
  const [liveDbLevel, setLiveDbLevel] = useState<number>(-54);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const lastAcousticUpdateRef = useRef<number>(0);
  const lastMotionUpdateRef = useRef<number>(0);
  const gravityRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 9.81, z: 0 });

  // On-Device ML Audio Analyzer Pipeline (integrated from homesenseai.zip)
  const audioAnalyzerRef = useRef<HomeSenseOnDeviceAudioAnalyzer>(new HomeSenseOnDeviceAudioAnalyzer(48000));
  const lastMlAnalysisTimeRef = useRef<number>(0);
  const lastAlertedEventRef = useRef<string>('');
  const [latestMlAnalysis, setLatestMlAnalysis] = useState<AudioAnalysisPayload>({
    file_analyzed: 'live_telemetry.wav',
    duration_seconds: 2.0,
    rms_energy: 0.008,
    detected_event: 'Ambient / Quiet',
    confidence: 0.95,
    alert_level: 'NORMAL',
    recommendation: 'Environment quiet. Acoustic baseline nominal.',
    office_kit_ready: true,
    source: 'on_device_spectral',
  });

  const [isMotionSensorActive, setIsMotionSensorActive] = useState<boolean>(false);

  const isLight = theme === 'light';
  const isMonitoring = telemetry.status === 'active';

  // Real Hardware Device Motion Sensor (Accelerometer with High-Pass Vibration Filter)
  useEffect(() => {
    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      setIsMotionSensorActive(true);
      const now = performance.now();
      if (now - lastMotionUpdateRef.current < 100) return; // 10Hz throttle to keep UI silky smooth
      lastMotionUpdateRef.current = now;

      const accel = event.acceleration || event.accelerationIncludingGravity;
      if (accel && accel.x !== null && accel.y !== null && accel.z !== null) {
        let vibG = 0;
        if (event.acceleration && event.acceleration.x !== null) {
          // Direct linear acceleration (gravity-free)
          const ax = event.acceleration.x || 0;
          const ay = event.acceleration.y || 0;
          const az = event.acceleration.z || 0;
          const mag = Math.sqrt(ax * ax + ay * ay + az * az);
          vibG = mag / 9.81;
        } else {
          // High-pass filter to isolate mechanical vibration from 1G gravitational bias
          const alpha = 0.82;
          gravityRef.current.x = alpha * gravityRef.current.x + (1 - alpha) * (accel.x || 0);
          gravityRef.current.y = alpha * gravityRef.current.y + (1 - alpha) * (accel.y || 0);
          gravityRef.current.z = alpha * gravityRef.current.z + (1 - alpha) * (accel.z || 0);

          const lx = (accel.x || 0) - gravityRef.current.x;
          const ly = (accel.y || 0) - gravityRef.current.y;
          const lz = (accel.z || 0) - gravityRef.current.z;
          const mag = Math.sqrt(lx * lx + ly * ly + lz * lz);
          vibG = mag / 9.81;
        }

        const clampedG = Number(Math.min(1.5, Math.max(0.01, vibG)).toFixed(3));
        onUpdateTelemetry({ vibrationIndexG: clampedG });

        if (clampedG > 0.15 && !activeAnomaly) {
          triggerHaptic('warning');
        }
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [activeAnomaly, onUpdateTelemetry]);

  // Toggle Real Hardware Microphone Audio Sensor
  const toggleMicStream = async () => {
    triggerHaptic('tap');
    if (isMicStreamActive) {
      // Stop real mic stream
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsMicStreamActive(false);
      onShowToast('Microphone stream closed • Returned to calibrated DSP synthesis');
    } else {
      try {
        if (Capacitor.isNativePlatform()) {
          try {
            await (Capacitor as any).Plugins?.BeeVision?.requestAudioPermission();
          } catch (pErr) {
            console.warn('Native permission check:', pErr);
          }
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        micStreamRef.current = stream;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.65;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsMicStreamActive(true);
        triggerHaptic('success');
        onShowToast('✓ Real-Time Acoustic Microphone Sensor Connected (48kHz FFT)');
      } catch (err: any) {
        console.warn('Microphone permission error:', err);
        triggerHaptic('warning');
        onShowToast(`Microphone: ${err?.name || 'Error'} - ${err?.message || 'Permission denied'}`);
      }
    }
  };

  // Main Waveform & Frequency Processing Loop
  useEffect(() => {
    if (!isMonitoring) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const dataArray = new Uint8Array(256);

    const updateLoop = () => {
      if (isMicStreamActive && analyserRef.current && audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }

        // 1. TIME-DOMAIN DATA: Genuine physical sound pressure wave from device microphone sensor
        const timeData = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(timeData);

        const points = 68;
        const stepX = 340 / (points - 1);
        const dataStep = Math.floor(timeData.length / points);
        let path = '';

        for (let i = 0; i < points; i++) {
          const idx = Math.min(i * dataStep, timeData.length - 1);
          // timeData[idx] ranges 0..255, 128 is center
          const normalized = (timeData[idx] - 128) / 128;
          const x = i * stepX;
          const y = 70 - normalized * 55;
          path += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        setCurveD(path);

        // 2. FREQUENCY-DOMAIN DATA: Live FFT frequency analysis
        analyserRef.current.getByteFrequencyData(dataArray);

        let maxVal = 0;
        let peakIndex = 0;
        let totalVal = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const val = dataArray[i];
          totalVal += val;
          if (val > maxVal) {
            maxVal = val;
            peakIndex = i;
          }
        }

        const nyquist = audioContextRef.current.sampleRate / 2;
        const binHz = nyquist / dataArray.length;
        const peakHz = maxVal > 20 ? Math.round(peakIndex * binHz) : 842;
        const avgVal = totalVal / dataArray.length;
        const dbApprox = Math.round(-80 + (avgVal / 255) * 70);
        setLiveDbLevel(dbApprox);

        // Signal to noise ratio approx
        const snr = Math.max(12, Math.min(115, Math.round(45 + (maxVal - avgVal) * 0.4)));

        // Throttle React telemetry state update to 10Hz (every 100ms) to maintain 60FPS fluid SVG rendering
        const now = performance.now();
        if (now - lastAcousticUpdateRef.current > 100) {
          lastAcousticUpdateRef.current = now;
          onUpdateTelemetry({
            peakFrequencyHz: peakHz,
            noiseFloorDbfs: dbApprox,
            snrDb: snr,
          });
        }

        // Live On-Device ML Audio Classification (HomeSenseAudioAnalyzer pipeline)
        if (now - lastMlAnalysisTimeRef.current > 650) {
          lastMlAnalysisTimeRef.current = now;
          const floatData = new Float32Array(analyserRef.current.fftSize);
          if ('getFloatTimeDomainData' in analyserRef.current) {
            analyserRef.current.getFloatTimeDomainData(floatData);
          } else {
            for (let i = 0; i < timeData.length; i++) {
              floatData[i] = (timeData[i] - 128) / 128;
            }
          }

          const analysis = audioAnalyzerRef.current.analyzeSamples(
            floatData,
            audioContextRef.current.sampleRate
          );
          setLatestMlAnalysis(analysis);

          if (analysis.alert_level === 'CRITICAL' || analysis.alert_level === 'WARNING') {
            if (analysis.detected_event !== lastAlertedEventRef.current) {
              lastAlertedEventRef.current = analysis.detected_event;
              triggerHaptic(analysis.alert_level === 'CRITICAL' ? 'warning' : 'tick');
              onTriggerAnomalyAlert(analysis.detected_event);
              onShowToast(`🚨 ML Flagged: ${analysis.detected_event} (${analysis.alert_level})`);
            }
          }
        }

        // 10-band spectrum bars from real mic data
        const bandStep = Math.floor(dataArray.length / 10);
        const newHeights = Array.from({ length: 10 }, (_, idx) => {
          const sample = dataArray[idx * bandStep] || 0;
          return Math.max(8, Math.round((sample / 255) * 98));
        });
        setBarHeights(newHeights);
      } else {
        // High-precision calibrated DSP multi-harmonic motor synthesis (Grid 50Hz + mechanical harmonics)
        phaseRef.current += 0.06;
        const p = phaseRef.current;
        const points = 68;
        const stepX = 340 / (points - 1);
        let path = '';

        for (let i = 0; i < points; i++) {
          const x = i * stepX;
          const rad = (i / points) * Math.PI * 4 + p;
          // Multi-harmonic motor formula: Fundamental + 3rd harmonic + 5th harmonic
          const y = 70 - (Math.sin(rad) * 24 + Math.sin(rad * 3) * 8 + Math.sin(rad * 5) * 4);
          path += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        setCurveD(path);

        const syntheticHeights = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
          const h = Math.min(96, Math.max(14, Math.sin(p + i * 0.7) * 35 + 50));
          return Math.round(h);
        });
        setBarHeights(syntheticHeights);
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isMonitoring, isMicStreamActive, onUpdateTelemetry]);

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSimulateTargetEvent = (type: 'alarm' | 'water' | 'appliance' | 'ambient') => {
    triggerHaptic('tap');
    const simulatedSignal = audioAnalyzerRef.current.generateSimulatedSignal(type);
    const analysis = audioAnalyzerRef.current.analyzeSamples(simulatedSignal, 16000);
    setLatestMlAnalysis(analysis);
    lastAlertedEventRef.current = analysis.detected_event;

    if (type === 'alarm') {
      setActiveAnomaly('Smoke/Fire Alarm Beep');
      onUpdateTelemetry({ peakFrequencyHz: 3000, vibrationIndexG: 0.08 });
      onTriggerAnomalyAlert('Smoke/Fire Alarm Beep (+₹120 hazard alert)');
      onShowToast('🚨 CRITICAL: Smoke/Fire Alarm Beep Detected!');
      triggerHaptic('warning');
    } else if (type === 'water') {
      setActiveAnomaly('Continuous Running Water / Leak');
      onUpdateTelemetry({ peakFrequencyHz: 260, vibrationIndexG: 0.05 });
      onTriggerAnomalyAlert('Continuous Running Water / Leak (+₹60 leak waste)');
      onShowToast('⚠️ WARNING: Continuous Running Water / Leak Detected!');
      triggerHaptic('warning');
    } else if (type === 'appliance') {
      setActiveAnomaly('High Appliance Vibrations / Rattling');
      onUpdateTelemetry({ peakFrequencyHz: 150, vibrationIndexG: 0.22 });
      onTriggerAnomalyAlert('High Appliance Vibrations / Rattling (+₹85 extra spend)');
      onShowToast('⚠️ WARNING: High Appliance Mechanical Strain Detected!');
      triggerHaptic('warning');
    } else {
      setActiveAnomaly(null);
      onUpdateTelemetry({ peakFrequencyHz: 842, vibrationIndexG: 0.01 });
      onShowToast('Acoustic baseline restored to quiet ambient');
      triggerHaptic('tick');
    }
  };

  const handleSimulateAnomaly = (name: string, freq: number, vib: number, cost: number) => {
    triggerHaptic('warning');
    setActiveAnomaly(name);
    onUpdateTelemetry({
      peakFrequencyHz: freq,
      vibrationIndexG: vib,
    });
    onTriggerAnomalyAlert(`${name} (+₹${cost} extra spend)`);
    onShowToast(`🚨 Acoustic Anomaly Flagged: ${name} (${freq}Hz, ${vib}G)`);
  };

  const handleResetAcoustic = () => {
    triggerHaptic('tick');
    setActiveAnomaly(null);
    lastAlertedEventRef.current = '';
    const baseline = audioAnalyzerRef.current.analyzeSamples(new Float32Array(0));
    setLatestMlAnalysis(baseline);
    onUpdateTelemetry({
      peakFrequencyHz: 842,
      vibrationIndexG: 0.04,
    });
    onShowToast('Acoustic baseline restored to nominal calibration');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 pb-28 pt-20 px-4">
      {/* Top Status Strip */}
      <div className="flex items-center justify-between px-1">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
              : 'bg-[#0f141f] border-slate-800 text-slate-300'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isMonitoring ? 'bg-cyan-400 opacity-75' : 'bg-zinc-600'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isMonitoring ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-zinc-600'
              }`}
            />
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider font-code-spec">
              {isMicStreamActive ? 'MIC: HARDWARE LIVE' : 'MIC: DSP 48kHz'}
            </span>
            <span className="text-slate-500 text-[10px]">•</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider font-code-spec ${
              isMotionSensorActive ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {isMotionSensorActive ? 'ACCELEROMETER: LIVE' : 'MOTION: READY'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('tap');
            const nextStatus = isMonitoring ? 'paused' : 'active';
            onUpdateTelemetry({ status: nextStatus });
            onShowToast(nextStatus === 'active' ? 'Sensor Telemetry Resumed' : 'Sensor Telemetry Paused');
          }}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all active:scale-95 flex items-center gap-1 font-code-spec ${
            isMonitoring
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              : isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {isMonitoring ? 'pause' : 'play_arrow'}
          </span>
          <span>{isMonitoring ? 'LIVE' : 'PAUSED'}</span>
        </button>
      </div>

      {/* Main Oscilloscope & Harmonic Waveform Card (True AMOLED Obsidian) */}
      <div
        className={`relative rounded-3xl p-5 border shadow-2xl flex flex-col gap-4 overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-slate-200 shadow-xl text-slate-900'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 font-code-spec">
              Acoustic FFT Oscilloscope
            </span>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
              Harmonic Waveform
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold font-code-spec px-2.5 py-0.5 rounded-full border ${
              isLight
                ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
            }`}>
              SNR: {telemetry.snrDb} dB
            </span>
          </div>
        </div>

        {/* Oscilloscope Canvas Box */}
        <div className="relative w-full h-44 rounded-2xl bg-black border border-slate-800/90 overflow-hidden flex items-center justify-center shadow-inner">
          {/* Subtle Grid Lines */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#00f2fe 1px, transparent 1px), linear-gradient(90deg, #00f2fe 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Sine Waveform */}
          <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 340 140" preserveAspectRatio="none">
            <defs>
              <linearGradient id="waveGradAmoled" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d={curveD}
              fill="none"
              stroke="url(#waveGradAmoled)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_10px_rgba(0,242,254,0.7)]"
            />
          </svg>

          {/* Real-time Frequency Readout Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-400 font-code-spec">
              {telemetry.peakFrequencyHz} Hz Peak
            </span>
          </div>

          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 font-code-spec">
              {isMicStreamActive ? `${liveDbLevel} dBFS` : `${telemetry.noiseFloorDbfs} dBFS Floor`}
            </span>
          </div>

          {/* Equalizer Frequency Bars */}
          <div className="absolute bottom-2 inset-x-4 z-20 flex items-end justify-between h-10 pointer-events-none gap-1 opacity-75">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm transition-all duration-75"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Hardware Mic Toggle Button */}
        <button
          type="button"
          onClick={toggleMicStream}
          className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isMicStreamActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-cyan-400">
            {isMicStreamActive ? 'mic' : 'mic_none'}
          </span>
          <span>
            {isMicStreamActive
              ? 'Disconnect Live Hardware Mic (Using Calibration)'
              : 'Enable Real Device Microphone Sensor'}
          </span>
        </button>

        {/* Telemetry Matrix Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Vibration G force */}
          <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/90'
          }`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase font-code-spec">Vibration</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold font-code-spec ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {telemetry.vibrationIndexG}
              </span>
              <span className="text-[10px] text-cyan-500 font-semibold">G</span>
            </div>
            <span className="text-[9px] text-cyan-500 font-medium font-code-spec">
              {telemetry.vibrationIndexG > 0.12 ? 'High Drift' : 'Nominal <0.1G'}
            </span>
          </div>

          {/* Spectral Flux */}
          <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/90'
          }`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase font-code-spec">Flux Delta</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold font-code-spec ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {telemetry.spectralFluxDeltaS}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">ΔS</span>
            </div>
            <span className="text-[9px] text-slate-400 font-code-spec">Harmonic Steady</span>
          </div>

          {/* Sample Rate */}
          <div className={`p-3 rounded-2xl border flex flex-col justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0d14] border-slate-800/90'
          }`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase font-code-spec">Sampling</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-bold font-code-spec ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                {telemetry.fftSize}
              </span>
              <span className="text-[10px] text-slate-400 font-code-spec">pts</span>
            </div>
            <span className="text-[9px] text-cyan-500 font-medium font-code-spec">
              {telemetry.sampleRate}
            </span>
          </div>
        </div>
      </div>

      {/* On-Device Audio ML Classifier Card (from homesenseai.zip HomeSenseAudioAnalyzer) */}
      <div
        className={`rounded-3xl p-5 border shadow-2xl space-y-4 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-md'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.95)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-md ${
                latestMlAnalysis.alert_level === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : latestMlAnalysis.alert_level === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : isLight
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {latestMlAnalysis.alert_level === 'CRITICAL'
                  ? 'e911_emergency'
                  : latestMlAnalysis.alert_level === 'WARNING'
                  ? 'warning'
                  : 'graphic_eq'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">On-Device Audio ML</h3>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full font-code-spec uppercase ${
                    latestMlAnalysis.alert_level === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : latestMlAnalysis.alert_level === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {latestMlAnalysis.alert_level}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                HomeSense AudioSet &amp; Spectral Heuristic Engine
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold font-code-spec px-2 py-1 rounded-lg border ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-[#0a0d14] text-cyan-400 border-cyan-500/20'
            }`}
          >
            {Math.round(latestMlAnalysis.confidence * 100)}% CONF
          </span>
        </div>

        {/* Live Detected Event Banner */}
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            latestMlAnalysis.alert_level === 'CRITICAL'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : latestMlAnalysis.alert_level === 'WARNING'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : isLight
              ? 'bg-slate-50 border-slate-200 text-slate-800'
              : 'bg-[#0a0d14] border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider font-code-spec opacity-70">
              Active Acoustic Classification
            </span>
            <span className="text-[10px] font-bold font-code-spec opacity-80">
              RMS: {latestMlAnalysis.rms_energy}
            </span>
          </div>
          <div className="text-base font-extrabold mt-1 tracking-tight">
            {latestMlAnalysis.detected_event}
          </div>
          <p className="text-xs mt-1.5 opacity-90 leading-relaxed">
            {latestMlAnalysis.recommendation}
          </p>
        </div>

        {/* Office Kit Ready Badge */}
        {latestMlAnalysis.office_kit_ready && (
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border font-code-spec ${
              isLight
                ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-cyan-400">
                cloud_sync
              </span>
              <span className="font-semibold text-[11px]">
                Office Kit Workstation Mesh Sync Active
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              READY
            </span>
          </div>
        )}

        {/* Target Events Quick-Test Triggers */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-code-spec">
              Smart Living Target Validation (AudioSet)
            </span>
            {activeAnomaly && (
              <button
                type="button"
                onClick={handleResetAcoustic}
                className="text-[10px] font-bold text-cyan-500 hover:underline font-code-spec"
              >
                Reset Baseline
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSimulateTargetEvent('alarm')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                latestMlAnalysis.detected_event === 'Smoke/Fire Alarm Beep'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                  : isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Fire/Smoke Alarm</p>
                <p className="text-[10px] text-slate-400 font-code-spec">3kHz Tone Spikes</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-rose-400">
                notifications_active
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateTargetEvent('water')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                latestMlAnalysis.detected_event === 'Continuous Running Water / Leak'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Water Pipe Leak</p>
                <p className="text-[10px] text-slate-400 font-code-spec">Continuous Drip/Flow</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-cyan-400">
                water_drop
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateTargetEvent('appliance')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                latestMlAnalysis.detected_event === 'High Appliance Vibrations / Rattling'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Appliance Strain</p>
                <p className="text-[10px] text-slate-400 font-code-spec">Compressor Rattle</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-amber-400">
                precision_manufacturing
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateTargetEvent('ambient')}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                latestMlAnalysis.detected_event === 'Ambient / Quiet'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                  : isLight
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <div>
                <p className="text-xs font-bold">Quiet Ambient</p>
                <p className="text-[10px] text-slate-400 font-code-spec">&lt;0.01 RMS Silence</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-emerald-400">
                spa
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Acoustic Signature Anomaly Injector Card */}
      <div
        className={`rounded-3xl p-5 border shadow-2xl space-y-3 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#0f141f] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400 text-[20px]">troubleshoot</span>
            <h3 className="font-extrabold text-base">Diagnostic Anomaly Injection</h3>
          </div>
          {activeAnomaly && (
            <button
              type="button"
              onClick={handleResetAcoustic}
              className="text-[11px] font-bold text-cyan-500 hover:underline font-code-spec"
            >
              Reset Baseline
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Inject mechanical anomalies (bearing chatter, cavitation, valve leaks) to evaluate on-device acoustic neural classification and live cost impact.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleSimulateAnomaly('Motor Bearing Chatter', 1240, 0.18, 85)}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
              activeAnomaly === 'Motor Bearing Chatter'
                ? 'bg-rose-500/15 border-rose-500 text-rose-400 font-bold'
                : isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-400 font-code-spec">BEARING</span>
              <span className="material-symbols-outlined text-[16px] text-rose-400">warning</span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold truncate">Bearing Chatter</p>
              <p className="text-[10px] text-slate-400">1240 Hz • 0.18G (+₹85)</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateAnomaly('Cavitation Flutter', 980, 0.12, 45)}
            className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
              activeAnomaly === 'Cavitation Flutter'
                ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-bold'
                : isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-[#0a0d14] hover:bg-slate-900 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 font-code-spec">VALVE</span>
              <span className="material-symbols-outlined text-[16px] text-amber-400">air</span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-bold truncate">Cavitation Flutter</p>
              <p className="text-[10px] text-slate-400">980 Hz • 0.12G (+₹45)</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
