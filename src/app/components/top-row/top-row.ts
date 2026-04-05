import { Component, input } from '@angular/core';

@Component({
  selector: 'app-top-row',
  templateUrl: './top-row.html',
  styleUrl: './top-row.css',
})
export class TopRow {
  hebrewDate = input.required<string>();
  dedication = input.required<string>();
  gregorianDate = input.required<string>();
}
