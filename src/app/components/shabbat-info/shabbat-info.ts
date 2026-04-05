import { Component, input, inject } from '@angular/core';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-shabbat-info',
  templateUrl: './shabbat-info.html',
  styleUrl: './shabbat-info.css',
})
export class ShabbatInfo {
  private config = inject(ConfigService);

  dataLoaded = input.required<boolean>();
  candleLighting = input.required<string>();
  havdalahTime = input.required<string>();
  seasonRain = input.required<string>();

  readonly infoLineFontSize = this.config.shabbatInfoLineFontSize;
}
