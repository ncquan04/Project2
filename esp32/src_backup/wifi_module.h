#ifndef WIFI_MODULE_H
#define WIFI_MODULE_H

#include <WiFi.h>

void setupWiFi(const char* ssid, const char* password);
bool checkWiFiConnection();

#endif