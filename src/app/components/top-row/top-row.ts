import { Component, input, inject } from '@angular/core';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-top-row',
  templateUrl: './top-row.html',
  styleUrl: './top-row.css',
})
export class TopRow {
  private config = inject(ConfigService);

  hebrewDate = input.required<string>();
  dedication = input.required<string>();
  gregorianDate = input.required<string>();

  readonly hebrewDateFontSize = this.config.topRowHebrewDateFontSize;
  readonly dedicationFontSize = this.config.topRowDedicationFontSize;
  readonly gregorianDateFontSize = this.config.topRowGregorianDateFontSize;
}
