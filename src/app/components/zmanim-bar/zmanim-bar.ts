import { Component, input } from '@angular/core';
import { ZmanItem } from '../../services/hebcal.service';

@Component({
  selector: 'app-zmanim-bar',
  templateUrl: './zmanim-bar.html',
  styleUrl: './zmanim-bar.css',
})
export class ZmanimBar {
  zmanimLoading = input.required<boolean>();
  zmanimError = input.required<boolean>();
  zmanim = input.required<ZmanItem[]>();
}
