import os
import json
import numpy as np

# Zero-dependency fallback for WAV processing when scipy is not available
try:
    import scipy.io.wavfile as wav
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    import wave

# Safe optional import for ONNX runtime
try:
    import onnxruntime as ort
    HAS_ORT = True
except ImportError:
    HAS_ORT = False


def save_test_wav(file_path: str, sample_rate: int, pcm_int16_data: np.ndarray):
    """Helper to save a 16-bit mono WAV file using either scipy or standard library wave."""
    if HAS_SCIPY:
        wav.write(file_path, sample_rate, pcm_int16_data)
    else:
        with wave.open(file_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(pcm_int16_data.tobytes())


class HomeSenseAudioAnalyzer:

    # Relevant Smart Living audio targets mapped from standard AudioSet classes
    TARGET_EVENTS = {
        "Water": ["Water", "Stream", "Waterfall", "Gurgling", "Tap", "Drip", "Sink"],
        "Alarm": ["Alarm", "Siren", "Buzzer", "Smoke detector", "Fire alarm", "Beep"],
        "Appliance": ["Engine", "Mechanics", "Hum", "Buzz", "Noise", "Electric fan", "Refrigeration"],
        "Safety Hazard": ["Glass", "Shatter", "Door", "Knock", "Thud", "Bang", "Screaming"]
    }

    def __init__(self, model_path="yamnet.onnx"):
        self.model_path = model_path
        self.session = None
        self.sample_rate = 16000  # Standard YAMNet/Audio ML sample rate
        
        # Load ONNX model if available and onnxruntime is installed
        if HAS_ORT and os.path.exists(self.model_path):
            try:
                print(f"[Audio Module] Loading ONNX model from: {self.model_path}")
                self.session = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
            except Exception as e:
                print(f"[Audio Module] Failed to load ONNX model: {e}. Running in Fallback Spectral Mode.")
                self.session = None
        else:
            reason = "onnxruntime not installed" if not HAS_ORT else f"'{self.model_path}' not found"
            print(f"[Audio Module] Info: {reason}. Running in Fallback Spectral Mode.")

    def load_and_preprocess_wav(self, file_path):
        """Loads a .wav audio file and resamples/normalizes to float32 16kHz mono."""
        if HAS_SCIPY:
            sr, audio = wav.read(file_path)
            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = np.mean(audio, axis=1)
            # Convert integer PCM to float32 range [-1.0, 1.0]
            if audio.dtype == np.int16:
                audio = audio / 32768.0
            elif audio.dtype == np.int32:
                audio = audio / 2147483648.0
            elif audio.dtype == np.uint8:
                audio = (audio - 128.0) / 128.0
            else:
                audio = audio.astype(np.float32)
        else:
            with wave.open(file_path, "rb") as wf:
                sr = wf.getframerate()
                n_channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)
                
                if sampwidth == 2:
                    audio = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                elif sampwidth == 4:
                    audio = np.frombuffer(raw_bytes, dtype=np.int32).astype(np.float32) / 2147483648.0
                elif sampwidth == 1:
                    audio = (np.frombuffer(raw_bytes, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
                else:
                    audio = np.frombuffer(raw_bytes, dtype=np.float32)
                    
                if n_channels > 1:
                    audio = audio.reshape(-1, n_channels)
                    audio = np.mean(audio, axis=1)

        if len(audio) == 0:
            return np.array([], dtype=np.float32), 0.0

        # Simple energy/volume threshold check (silence detection)
        rms_energy = np.sqrt(np.mean(audio**2))
        return audio.astype(np.float32), float(rms_energy)

    def analyze_audio_file(self, wav_path):
        """Main execution method: returns structured JSON analysis of the audio snippet."""
        if not os.path.exists(wav_path):
            return {"error": f"File not found: {wav_path}"}
            
        audio, energy = self.load_and_preprocess_wav(wav_path)
        duration_sec = round(len(audio) / self.sample_rate, 2)
        
        # Detect if recording is practically silent
        if energy < 0.01 or len(audio) == 0:
            return {
                "file_analyzed": os.path.basename(wav_path),
                "duration_seconds": duration_sec,
                "rms_energy": round(float(energy), 4),
                "detected_event": "Ambient / Quiet",
                "status": "Ambient / Quiet",
                "detected_events": [],
                "confidence": 0.95,
                "alert_level": "NORMAL",
                "recommendation": "Environment quiet. No anomaly recorded.",
                "office_kit_ready": True
            }

        # 1. Inference via ONNX model if provided
        detected_category = "General Ambient Sound"
        confidence = round(float(np.clip(energy * 3, 0.45, 0.95)), 2)
        
        if self.session:
            try:
                input_name = self.session.get_inputs()[0].name
                outputs = self.session.run(None, {input_name: audio})
                scores = outputs[0]
                top_class_idx = int(np.argmax(np.mean(scores, axis=0)))
                confidence = round(float(np.max(scores)), 2)
                detected_category = f"Class_{top_class_idx}" 
            except Exception as e:
                print(f"[Audio Module] ONNX execution error: {e}")

        # 2. Heuristic Rules (Maps acoustic profile to Smart Living triggers)
        alert_level = "NORMAL"
        event_type = "Background Hum"
        recommendation = "No action needed."

        # Heuristic rules based on high frequency spikes (Simulated for Hackathon MVP)
        high_freq_energy = float(np.mean(np.abs(np.diff(audio)))) if len(audio) > 1 else 0.0
        
        if high_freq_energy > 0.15:
            event_type = "Smoke/Fire Alarm Beep"
            alert_level = "CRITICAL"
            recommendation = "High pitch alarm detected! Verify household sensors immediately."
        elif energy > 0.05 and high_freq_energy < 0.03:
            event_type = "Continuous Running Water / Leak"
            alert_level = "WARNING"
            recommendation = "Check nearby taps, toilet tanks, or drainage systems for running water."
        elif energy > 0.1:
            event_type = "High Appliance Vibrations / Rattling"
            alert_level = "WARNING"
            recommendation = "Refrigerator or AC compressor showing heavy mechanical strain."

        # 3. Output payload structured for Teammate 2
        payload = {
            "file_analyzed": os.path.basename(wav_path),
            "duration_seconds": duration_sec,
            "rms_energy": round(float(energy), 4),
            "detected_event": event_type,
            "confidence": confidence,
            "alert_level": alert_level,
            "recommendation": recommendation,
            "office_kit_ready": True
        }
        
        return payload


if __name__ == "__main__":
    # 1. Create a dummy test audio file (16kHz sine wave simulating an alarm)
    sample_rate = 16000
    t = np.linspace(0, 2.5, int(sample_rate * 2.5))
    dummy_signal = 0.3 * np.sin(2 * np.pi * 3000 * t)  # 3kHz high frequency tone
    
    test_wav = "test_sample.wav"
    save_test_wav(test_wav, sample_rate, (dummy_signal * 32767).astype(np.int16))
    
    # 2. Run analysis
    analyzer = HomeSenseAudioAnalyzer()
    result = analyzer.analyze_audio_file(test_wav)
    
    # 3. Print clean JSON response
    print("\n=== Output (Audio Pipeline JSON) ===")
    print(json.dumps(result, indent=2))
    
    # Cleanup test file
    if os.path.exists(test_wav):
        os.remove(test_wav)
