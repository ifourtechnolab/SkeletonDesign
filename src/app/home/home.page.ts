import { Component } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  galleryType = 'regular';
  isNoRecord = false;

  constructor(private photoService: PhotoService) { }

  ionViewWillEnter() {
    setTimeout(() => {
      this.photoService.loadSaved();

      if (this.photoService.arrPhotos.length === 0) {
        this.isNoRecord = true;
      } else {
        this.isNoRecord = false;
      }
    }, 5000);
  }
}
