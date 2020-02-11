import { Injectable, ApplicationRef } from '@angular/core';
import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';
import { ToastService } from './toast.service';
import { ActionSheetController, Platform } from '@ionic/angular';
import { File } from '@ionic-native/file/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { FilePath } from '@ionic-native/file-path/ngx';
import { Crop } from '@ionic-native/crop/ngx';

@Injectable()
export class PhotoService {

  arrPhotos: Photo[] = [];
  arrSelected: Photo[] = [];

  constructor(private camera: Camera, private file: File, private crop: Crop, private toastService: ToastService,
              private actionSheetController: ActionSheetController, private webview: WebView, private ref: ApplicationRef,
              private filePath: FilePath, private platform: Platform) { }

  loadSaved() {
    const arr = localStorage.getItem('photos');
    this.arrPhotos = arr ? JSON.parse(arr) : [];
  }

  async selectImage() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Select Image source',
      buttons: [{
        text: 'Load from Library',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.PHOTOLIBRARY);
        }
      }, {
        text: 'Use Camera',
        handler: () => {
          this.takePicture(this.camera.PictureSourceType.CAMERA);
        }
      }, {
        text: 'Cancel',
        role: 'cancel'
      }]
    });
    await actionSheet.present();
  }

  async takePicture(sourceType: PictureSourceType) {
    const options: CameraOptions = {
      quality: 100,
      sourceType,
      saveToPhotoAlbum: false,
      correctOrientation: true,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then(imagePath => {
      this.crop.crop(imagePath, { quality: 100 }).then(newImage => {
        if (this.platform.is('android')) {
          this.filePath.resolveNativePath(newImage).then(filePath => {
            const correctPath = filePath.substr(0, filePath.lastIndexOf('/') + 1);
            const currentName = newImage.substring(newImage.lastIndexOf('/') + 1, newImage.lastIndexOf('?'));
            this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
          });
        } else {
          const currentName = newImage.substr(newImage.lastIndexOf('/') + 1);
          const correctPath = newImage.substr(0, newImage.lastIndexOf('/') + 1);
          this.copyFileToLocalDir(correctPath, currentName, this.createFileName());
        }
      }, () => { });
    });
  }

  createFileName(): string {
    const d = new Date();
    const n = d.getTime();
    const newFileName = n + '.jpg';
    return newFileName;
  }

  copyFileToLocalDir(namePath: string, currentName: string, newFileName: string) {
    this.file.moveFile(namePath, currentName, this.file.dataDirectory, newFileName).then(() => {
      this.updateStoredImages(newFileName);
    }, err => {
      this.toastService.presentToast(JSON.stringify(err));
    });
  }

  async updateStoredImages(name: string) {
    const filePath = this.file.dataDirectory + name;
    const resPath = this.pathForImage(filePath);

    const newEntry: Photo = {
      Name: name,
      Path: resPath,
      Filepath: filePath,
      IsSelect: false
    };
    this.arrPhotos = [newEntry, ...this.arrPhotos]; // Spread operator array
    localStorage.setItem('photos', JSON.stringify(this.arrPhotos));
    this.ref.tick();
  }

  pathForImage(img: string): string {
    return img === null ? '' : this.webview.convertFileSrc(img);
  }

  selectMultipleImage(item: Photo) {
    const index = this.arrSelected.indexOf(item);
    if (index !== -1) {
      item.IsSelect = false;
      this.arrSelected.splice(index, 1);
    } else {
      item.IsSelect = true;
      this.arrSelected.push(item);
    }
  }

  deleteImage() {
    this.arrSelected.forEach(itemDelete => {
      this.arrPhotos.forEach(item => {
        if (itemDelete.Name === item.Name) {
          const index = this.arrPhotos.indexOf(item);
          this.arrPhotos.splice(index, 1);
          const correctPath = item.Filepath.substr(0, item.Filepath.lastIndexOf('/') + 1);

          this.file.removeFile(correctPath, item.Name).then(() => {
            this.toastService.presentToast('Image deleted successfully.');
          });
        }
      });
    });
    this.arrSelected = [];
    localStorage.setItem('photos', JSON.stringify(this.arrPhotos));
  }
}
