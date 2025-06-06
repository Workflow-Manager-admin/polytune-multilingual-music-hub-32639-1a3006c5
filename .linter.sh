#!/bin/bash
cd /home/kavia/workspace/code-generation/polytune-multilingual-music-hub-32639-1a3006c5/poly_tune_multilingual_music_hub
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

