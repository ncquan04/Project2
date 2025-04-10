#ifndef LCD_MODULE_H
#define LCD_MODULE_H

#include <LiquidCrystal_I2C.h>

void setupLCD(LiquidCrystal_I2C& lcd);
void displayLCD(LiquidCrystal_I2C& lcd, const char* title, const char* message);

#endif