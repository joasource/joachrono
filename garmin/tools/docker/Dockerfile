FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libwebkit2gtk-4.0-37 libjavascriptcoregtk-4.0-18 libgtk-3-0 libusb-1.0-0 \
    libpng16-16 libsoup2.4-1 ca-certificates openjdk-17-jre adwaita-icon-theme \
    libcanberra-gtk3-module dbus-x11 libcurl4 libsm6 libice6 \
 && rm -rf /var/lib/apt/lists/*
