import { Component, input, inject } from '@angular/core';
import { ZmanItem } from '../../services/hebcal.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-zmanim-bar',
  templateUrl: './zmanim-bar.html',
  styleUrl: './zmanim-bar.css',
})
export class ZmanimBar {
  private config = inject(ConfigService);

  zmanimLoading = input.required<boolean>();
  zmanimError = input.required<boolean>();
  zmanim = input.required<ZmanItem[]>();

  readonly titleFontSize = this.config.zmanimBarTitleFontSize;
  readonly valueFontSize = this.config.zmanimBarValueFontSize;
}
