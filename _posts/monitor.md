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

