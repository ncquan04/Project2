#ifndef RFID_MODULE_H
#define RFID_MODULE_H

#include <MFRC522.h>
#include <SPI.h>

#define SS_PIN 5    // Chân SDA (SS)
#define RST_PIN 17  // Chân RST

extern MFRC522 mfrc522;  // Đối tượng MFRC522 toàn cục

void setupRFID();  // Khởi tạo module RFID
String readRFID(); // Đọc UID từ thẻ RFID

#endif