## Method 1
Outbound call. Place a call from any phone to a dedicated number. No input or confirmations required. When finished hang up or press #. Optionally transcriptions can be run at Twilio however you can expect upwards of $20 a day for that and will have some time limitations as well, so that's disabled and we can handle those locally. To setup get a number and create a Twiml Bin for incoming calls, like so:

Twiml Bin
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Record 
        maxLength="43200" 
        timeout="3600"
        recordingStatusCallback="https://raykooyenga.com/recording-status"
        recordingStatusCallbackMethod="POST"
        transcribe="false"
        trim="trim-silence"
        finishOnKey="#"
        playBeep="false" />
    <Pause length="3600" />
</Response>
```

Next we need to retrieve which can be done in the logs area on the site, via the API, or we can setup an app for this
and handle mailing files and even transcriptions we processed on something like Whisper

[to be continued]

## Method 2
Console recording with alsa/pulse/pipewire. For older traditional setups `rec` should be a familiar command in the `sox` library. We're going to be using `pipewire` though as `pw-record` in our `pw-rec` script. This is going to give an easy way to start, make sure we stay running. We can convert later if we need to save space and be portable, as we want PCM for other tasks like transcription, spectrogram, volume processing and other needs that may arise. 

pipewire
```bash
#!/bin/bash

RATE=44000
CHANNELS=1
FORMAT=s16
DIR="/media/ray/WDBLACK500FS/home/Audio"
mkdir -p "$DIR"

while true; do
    if [ -f stop_recording.flag ]; then
        echo "Stop flag detected. Exiting recording loop."
        break
    fi

    TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
    FILENAME="$DIR/recording_$TIMESTAMP.wav"

    echo "Starting recording: $FILENAME"

    # use pipewire. change to recfor sox and alsa or pulse if not using pipewire
    pw-record --rate "$RATE" --channels "$CHANNELS" --format "$FORMAT" "$FILENAME" &
    PID=$!

    # Wait for the process to finish
    wait $PID
    echo "Recording crashed or stopped. Restarting in 5 seconds unless stopped..."
    sleep 5
done
```

```bash

```

## Transcribing

Let's do some install and setups here yours may vary

```
sudo apt update
sudo apt install -y build-essential libssl-dev zlib1g-dev \
  libbz2-dev libreadline-dev libsqlite3-dev curl \
  llvm libncursesw5-dev xz-utils tk-dev \
  libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

curl https://pyenv.run | bash
```

```
source ~/.bashrc
```

```
pyenv install 3.11.9
pyenv global 3.11.9
pyenv virtualenv 3.11.9 whisper-env
pyenv activate whisper-env
```

in `.bashrc`
```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"

# Initialize pyenv
if command -v pyenv 1>/dev/null 2>&1; then
  eval "$(pyenv init --path)"
  eval "$(pyenv init -)"
  eval "$(pyenv virtualenv-init -)"
fi
```

```bash
pip install git+https://github.com/openai/whisper.git
```
or
```bash
pip install faster-whisper
```

We're going with the latter and using this wrapper:

```python
# transcribe.py
from faster_whisper import WhisperModel
import sys
import os

model_size = "base"  # or "small", "medium", "large-v2"
audio_path = sys.argv[1]

# Load model
model = WhisperModel(model_size, compute_type="auto")

# Transcribe
segments, info = model.transcribe(audio_path, beam_size=5)

# Print metadata
print(f"Detected language: {info.language}, Duration: {info.duration:.2f}s")

# Write transcript to file
output_file = os.path.splitext(audio_path)[0] + ".txt"
with open(output_file, "w") as f:
    for segment in segments:
        f.write(f"[{segment.start:.2f} - {segment.end:.2f}] {segment.text.strip()}\n")

print(f"Transcript saved to: {output_file}")
```

node [to be continued]
```node
const { spawn } = require('child_process');
const whisper = spawn('python3', ['transcribe.py', 'recording.opus']);
```

run it
```bash
pyenv activate whisper-env
python transcribe.py [file.wav]
```

