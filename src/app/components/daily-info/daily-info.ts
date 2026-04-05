import { Component, input, inject } from '@angular/core';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-daily-info',
  templateUrl: './daily-info.html',
  styleUrl: './daily-info.css',
})
export class DailyInfo {
  private config = inject(ConfigService);

  parashaName = input.required<string>();
  showOmer = input.required<boolean>();
  omerCount = input.required<string>();
  seasonWind = input.required<string>();
  dafYomi = input.required<string>();

  readonly parashaLabelFontSize = this.config.dailyInfoParashaLabelFontSize;
  readonly parashaValueFontSize = this.config.dailyInfoParashaValueFontSize;
  readonly infoLineFontSize = this.config.dailyInfoLineFontSize;
}
