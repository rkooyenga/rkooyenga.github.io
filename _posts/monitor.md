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
and handle mailing failes and even transcriptions we processed on something like Whisper

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

