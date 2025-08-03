#!/bin/bash

# Android SDK Configuration
# Add these lines to your ~/.bashrc or ~/.zshrc file

export ANDROID_HOME=/home/dogeyboy19/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# To apply these changes immediately, run:
# source ~/.bashrc
# or
# source ~/.zshrc

echo "Android SDK environment variables configured"
echo "ANDROID_HOME: $ANDROID_HOME"
echo "SDK tools added to PATH"
