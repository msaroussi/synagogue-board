import { Component, input } from '@angular/core';

@Component({
  selector: 'app-daily-info',
  templateUrl: './daily-info.html',
  styleUrl: './daily-info.css',
})
export class DailyInfo {
  parashaName = input.required<string>();
  showOmer = input.required<boolean>();
  omerCount = input.required<string>();
  seasonWind = input.required<string>();
  dafYomi = input.required<string>();
}
