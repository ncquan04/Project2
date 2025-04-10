#ifndef HTTP_MODULE_H
#define HTTP_MODULE_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>

void sendAttendanceData(const char* serverUrl, const char* apiKey, const char* rfid_uid, const char* room, LiquidCrystal_I2C& lcd);

#endif