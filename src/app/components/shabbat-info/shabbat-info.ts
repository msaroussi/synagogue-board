import { Component, input } from '@angular/core';

@Component({
  selector: 'app-shabbat-info',
  templateUrl: './shabbat-info.html',
  styleUrl: './shabbat-info.css',
})
export class ShabbatInfo {
  dataLoaded = input.required<boolean>();
  candleLighting = input.required<string>();
  havdalahTime = input.required<string>();
  seasonRain = input.required<string>();
}
